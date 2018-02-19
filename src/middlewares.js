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
    listAll: handleError(async ({params: {from}, query}, res) => {
      const {page = 1, 'results-per-page': perPage = 100, 'order-by': orderBy = 'id', 'order-direction': orderDir = 'asc'} = query;
      const sanitizedPerPage = Math.max(1, Math.min(100, isNaN(perPage) ? 100 : perPage));
      const connection = await SqlDriver.getConnection(pool);
      try {
        const count = await SqlDriver.count({connection, from});
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(`{"total_results":${count},"total_pages":${Math.ceil(count / sanitizedPerPage)},"prev_url":null,"next_url":null,"resources":[`);
        if (count > 0) {
          await SqlDriver.writeRows({
            connection,
            from,
            page: Math.max(1, page),
            perPage: sanitizedPerPage,
            orderBy: `${from}.${metadata[from].orderBys.indexOf(orderBy) !== -1 ? orderBy : 'id'}`,
            orderDir: orderDir.toLowerCase() === 'desc' ? 'desc' : 'asc',
            res
          });
        }
        res.write(']}');
      } finally {
        connection.release();
      }
    }),
    requireMetadata: ({params: {from}}, res, next) => next(!metadata[from] && 'route')
  })
});