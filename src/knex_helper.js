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

module.exports = ({
  knex,
  new: knex => ({
    streamPage: async ({from, page, perPage, orderBy, orderDir, write}) => {
      let query = knex.select(columns(from)).from(from).orderBy(orderBy, orderDir).limit(perPage);

      const leftJoinsFrom = leftJoins(from);
      leftJoinsFrom.forEach(leftJoin => query = query.leftJoin(...leftJoin));

      if (page > 1) {
        const [result] = await knex.select('id').from(from).orderBy(orderBy, orderDir).limit(1).offset(perPage * (page - 1) - 1);
        query = query.where(`${from}.id`, '>', result ? result.id : null);
      }

      await query.stream(stream => stream.pipe(StreamHelper.newWritableStream(write)));
    },
    tableCount: async table => (await knex(table).count('id as count'))[0].count,
  })
});