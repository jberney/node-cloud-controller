const entities = require('./entities');

module.exports = ({
  new: ({info, pool, SqlDriver}) => ({
    info: (req, res) => res.send(info),
    listAll: async (req, res, next) => {
      const from = req.params.type;

      if (!entities[from]) return next();

      try {
        const connection = await SqlDriver.getConnection(pool);
        try {
          const count = await SqlDriver.count({connection, from});
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(`{"total_results":${count},"total_pages":${Math.ceil(count / 100)},"prev_url":null,"next_url":null,"resources":[`);
          if (count > 0) await SqlDriver.writeRows({connection, from, res});
          res.write(']}');
        } finally {
          connection.release();
        }
      } finally {
        res.end();
      }
    }
  })
});