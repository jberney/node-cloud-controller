const metadata = require('./metadata');
const ServerHelper = require('./server_helper');
const QueryBuilder = require('./query_builder');

const leftJoins = from => Object.values(metadata[from].entity)
  .filter(({foreignTable}) => foreignTable)
  .reduce((memo, {foreignTable}) => memo.indexOf(foreignTable) === -1 ? [...memo, foreignTable] : memo, [])
  .map(foreignTable => ({foreignTable, fromKey: `${foreignTable.replace(/s$/, '')}_id`, foreignKey: 'id'}));
const pauseWriteResume = ({connection, res}) => cb => (connection.pause(), cb(data => res.write(data, () => connection.resume())));
const query = (connection, ...args) => new Promise((res, rej) => connection.query(...args, (e, results) => e ? rej(e) : res(results)));
const queryStream = (connection, result, ...args) => new Promise((res, rej) => connection.query(...args).on('error', rej).on('end', res).on('result', result));
const writeRow = ({connection, res, ...rest}) => pauseWriteResume({connection, res})(ServerHelper.writeRow(rest));

module.exports = {
  count: async ({connection, from}) => (await query(connection, 'SELECT COUNT(*) AS count FROM ??', [from]))[0].count,
  getConnection: pool => new Promise((res, rej) => pool.getConnection((e, connection) => e ? rej(e) : res(connection))),
  writeRows: async ({connection, from, perPage = 100, orderBy, orderDir, res}) => {
    let prefix;
    const result = row => (writeRow({connection, res, prefix, row, from}), prefix = ',');
    const sql = QueryBuilder.select().from(from)
      .leftJoins(leftJoins(from))
      .limit(perPage)
      .orderBy(orderBy, orderDir)
      .build();
    await queryStream(connection, result, {sql, nestTables: true});
  }
};