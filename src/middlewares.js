const metadata = require('./metadata');

const handleError = cb => async (req, res, next) => {
  try {
    await cb(req, res, next);
  } finally {
    res.end();
  }
};

module.exports = ({
  new: ({info, pool, SqlDriver}) => ({
    info: (req, res) => res.send(info),
    listAll: handleError(async ({params: {from}, query: {'order-by': orderBy, 'order-direction': orderDir}}, res) => {
      const connection = await SqlDriver.getConnection(pool);
      try {
        const count = await SqlDriver.count({connection, from});
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(`{"total_results":${count},"total_pages":${Math.ceil(count / 100)},"prev_url":null,"next_url":null,"resources":[`);
        orderBy = `${from}.${metadata[from].orderBys.indexOf(orderBy) !== -1 ? orderBy : 'id'}`;
        if (count > 0) await SqlDriver.writeRows({connection, from, orderBy, orderDir, res});
        res.write(']}');
      } finally {
        connection.release();
      }
    }),
    requireMetadata: ({params: {from}}, res, next) => next(!metadata[from] && 'route')
  })
});