const metadata = require('./metadata');
const ServerHelper = require('./server_helper');
const QueryBuilder = require('./query_builder');

const columns = from => Object.entries(metadata[from].entity)
  .map(([key, {foreignTable, column}]) => `${foreignTable || from}.${column || key}`)
  .filter((value, i, self) => self.indexOf(value) === i);
const leftJoins = from => Object.values(metadata[from].entity)
  .filter(({foreignTable}) => foreignTable)
  .reduce((memo, {foreignTable}) => memo.indexOf(foreignTable) === -1 ? [...memo, foreignTable] : memo, [])
  .map(foreignTable => ({foreignTable, fromKey: `${foreignTable.replace(/s$/, '')}_id`, foreignKey: 'id'}));
const pauseWriteResume = ({connection, res}) => cb => (connection.pause(), cb(data => res.write(data, () => connection.resume())));
const query = (connection, ...args) => new Promise((res, rej) => connection.query(...args, (e, results) => e ? rej(e) : res(results)));
const queryStream = (connection, result, ...args) => new Promise((res, rej) => connection.query(...args).on('error', rej).on('end', res).on('result', result));
const writeRow = ({connection, res, ...rest}) => pauseWriteResume({connection, res})(ServerHelper.writeRow(rest));

module.exports = {
  count: async ({connection, from}) => (await query(connection, QueryBuilder.count(from)))[0].count,
  getConnection: pool => new Promise((res, rej) => pool.getConnection((e, connection) => e ? rej(e) : res(connection))),
  writeRows: async ({connection, from, page = 1, perPage = 100, orderBy = 'id', orderDir = 'asc', res}) => {
    let prefix;
    const result = row => (writeRow({connection, res, prefix, row, from}), prefix = ',');
    const leftJoinsFrom = leftJoins(from);

    let sql = QueryBuilder.select(columns(from)).from(from)
      .leftJoins(leftJoinsFrom)
      .orderBy(orderBy, orderDir)
      .limit(perPage);

    if (page > 1) {
      const [{id}] = await query(connection, {
        sql: QueryBuilder.select(['organizations.id']).from(from)
          .leftJoins(leftJoinsFrom)
          .orderBy(orderBy, orderDir)
          .limit(1)
          .offset(perPage * (page - 1) - 1)
          .build()
      });
      sql = sql.where(`${from}.id`, '>', id);
    }

    await queryStream(connection, result, {sql: sql.build(), nestTables: true});
  }
};