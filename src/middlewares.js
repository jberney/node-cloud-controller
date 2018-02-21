const metadata = require('./metadata');
const ServerHelper = require('./server_helper');

module.exports = ({
  new: ({info, knexHelper}) => ({
    handleError: cb => async (req, res, next) => {
      try {
        await cb(req, res, next);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        res.status(500);
      } finally {
        res.end();
      }
    },
    info: (req, res) => res.send(info),
    listAll: async ({params: {from}, query}, res) => {
      let {
        q, page = 1, 'results-per-page': perPage = 100, 'order-by': orderBy = 'id', 'order-direction': orderDir = 'asc'
      } = query;

      q = /(.+)(:|>=|<=|<|>| IN )(.+)/.exec(q);
      q = q && q.slice(1, 4);
      page = Math.max(1, page);
      perPage = Math.max(1, Math.min(100, isNaN(perPage) ? 100 : perPage));
      orderBy = `${from}.${metadata[from].orderBys.indexOf(orderBy) !== -1 ? orderBy : 'id'}`;
      orderDir = orderDir.toLowerCase() === 'desc' ? 'desc' : 'asc';

      const count = await knexHelper.tableCount({from, q});
      const envelope = JSON.stringify({
        total_results: count, total_pages: Math.ceil(count / perPage), prev_url: null, next_url: null, resources: []
      });

      if (count === 0) return res.end(envelope);

      let prefix = envelope.substr(0, envelope.length - 2);
      const write = row =>
        (res.write(`${prefix}${JSON.stringify(ServerHelper.toV2Object({from, row}))}`), prefix = ',');
      await knexHelper.streamPage({from, q, page, perPage, orderBy, orderDir, write});
      res.end(envelope.substr(-2));
    },
    requireMetadata: ({params: {from}}, res, next) => next(!metadata[from] && 'route'),
    setJsonContentType: (req, res, next) => (res.set('Content-Type', 'application/json'), next())
  })
});