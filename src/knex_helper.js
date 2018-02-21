const knex = require('knex');
const metadata = require('./metadata');
const StreamHelper = require('./stream_helper');

const columns = from => Object.entries({...metadata[from].entity, created_at: {}, updated_at: {}})
  .map(([key, {foreignTable, column}]) => `${foreignTable || from}.${column || key}`)
  .filter((value, i, self) => self.indexOf(value) === i)
  .reduce((memo, value) => ({...memo, [value]: value}), {});
const leftJoins = from => Object.values(metadata[from].entity)
  .filter(({foreignTable}) => foreignTable)
  .reduce((memo, {foreignTable}) => memo.indexOf(foreignTable) === -1 ? [...memo, foreignTable] : memo, [])
  .map(foreignTable => ([foreignTable, `${from}.${foreignTable.replace(/s$/, '')}_id`, `${foreignTable}.id`]));

const filters = ({from, q, query}) => {
  if (!q) return;
  const [filter, operator, value] = q;
  if (operator === ':') query.where(`${from}.${filter}`, value);
  else if (operator === ' IN ') query.whereIn(`${from}.${filter}`, value.split(','));
  else if (['>=', '<=', '<', '>'].indexOf(operator) !== -1) query.where(`${from}.${filter}`, operator, +value);
};

module.exports = ({
  knex,
  new: knex => ({
    streamPage: async ({from, q, page, perPage, orderBy, orderDir, write}) => {
      const query = knex.select(columns(from)).from(from).orderBy(orderBy, orderDir).limit(perPage);

      const leftJoinsFrom = leftJoins(from);
      leftJoinsFrom.forEach(leftJoin => query.leftJoin(...leftJoin));

      filters({from, q, query});

      if (page > 1) {
        const seekQuery = knex.select(orderBy).from(from).orderBy(orderBy, orderDir).limit(1).offset(perPage * (page - 1) - 1);
        filters({from, q, query: seekQuery});
        const [result] = await seekQuery;
        query.where(orderBy, orderDir === 'asc' ? '>' : '<', result ? result[orderBy.split('.').pop()] : null);
      }

      await query.stream(stream => stream.pipe(StreamHelper.newWritableStream(write)));
    },
    tableCount: async ({from, q}) => {
      const query = knex(from).count('id as count');
      filters({from, q, query});
      return (await query)[0].count;
    }
  })
});