const mysql = require('mysql');
const ServerHelper = require('./server_helper');
const queryBuilder = require('./query_builder');

module.exports = ({
  new(config) {
    const pool = mysql.createPool(config);

    const getConnection = cb => pool.getConnection((e, connection) => {
      if (e) throw e;
      cb(connection);
    });
    const pauseWriteResume = ({connection, res}) => cb => (connection.pause(), cb(data => res.write(data, () => connection.resume())));
    const writeRow = ({connection, res, ...rest}) => pauseWriteResume({connection, res})(ServerHelper.writeRow(rest));

    const writeList = ({from, leftJoins = [], entity}) => (req, res) => getConnection(connection => {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.write('{"resources":[');
      let prefix;
      const sql = queryBuilder.select().from(from)
        .leftJoins(leftJoins)
        .build();
      connection.query({sql, nestTables: true})
        .on('result', row => (writeRow({connection, res, prefix, row, from, entity}), prefix = ','))
        .on('end', () => (connection.release(), res.write(']}'), res.end()));
    });

    return {writeList};
  }
});