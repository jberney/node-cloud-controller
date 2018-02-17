const mysql = require('mysql');
const ServerHelper = require('./server_helper');
const queryBuilder = require('./query_builder');

const getConnection = (pool, cb) => pool.getConnection((e, connection) => {
  if (e) throw e;
  cb(connection);
});
const leftJoins = ({from, entity}) => Object.values(entity)
  .filter(({foreignTable}) => foreignTable)
  .reduce((memo, {foreignTable}) => memo.indexOf(foreignTable) === -1 ? [...memo, foreignTable] : memo, [])
  .map(foreignTable => ({foreignTable, fromKey: `${foreignTable.replace(/s$/, '')}_id`, foreignKey: 'id'}));
const pauseWriteResume = ({connection, res}) => cb => (connection.pause(), cb(data => res.write(data, () => connection.resume())));
const writeRow = ({connection, res, ...rest}) => pauseWriteResume({connection, res})(ServerHelper.writeRow(rest));

module.exports = ({
  new(config) {
    const pool = mysql.createPool(config);

    const writeList = ({from, entity}) => (req, res) => getConnection(pool, connection => {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.write('{"resources":[');
      let prefix;
      const sql = queryBuilder.select().from(from)
        .leftJoins(leftJoins({from, entity}))
        .build();
      connection.query({sql, nestTables: true})
        .on('result', row => (writeRow({connection, res, prefix, row, from, entity}), prefix = ','))
        .on('end', () => (connection.release(), res.write(']}'), res.end()));
    });

    return {writeList};
  }
});