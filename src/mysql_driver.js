const mysql = require('mysql');
const ServerHelper = require('./server_helper');

module.exports = ({
  new(config) {
    const pool = mysql.createPool(config);

    const getConnection = cb => pool.getConnection((e, connection) => {
      if (e) throw e;
      cb(connection);
    });
    const leftJoin = ({table}) => ({foreignTable, key, foreignKey}) => ` LEFT JOIN ${foreignTable} ON ${table}.${key} = ${foreignTable}.${foreignKey}`;
    const pauseWriteResume = ({connection, res}) => cb => (connection.pause(), cb(data => res.write(data, () => connection.resume())));
    const writeRow = ({connection, res, ...rest}) => pauseWriteResume({connection, res})(ServerHelper.writeRow(rest));

    const writeList = ({table, joins = [], entity}) => (req, res) => getConnection(connection => {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.write('{"resources":[');
      let prefix;
      connection.query({sql: `SELECT * FROM ${table}${joins.map(leftJoin({table}))}`, nestTables: true})
        .on('result', row => (writeRow({connection, res, entity, prefix, table, row}), prefix = ','))
        .on('end', () => (connection.release(), res.write(']}'), res.end()));
    });

    return {writeList};
  }
});