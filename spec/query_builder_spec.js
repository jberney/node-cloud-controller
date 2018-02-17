describe('QueryBuilder', () => {
  let queryBuilder;

  beforeEach(() => {
    queryBuilder = require('../src/query_builder');
  });

  describe('select', () => {
    describe('basic', () => {
      it('returns sql', () => {
        expect(queryBuilder.select().from('from-table').build()).toBe('SELECT * FROM `from-table`');
      });
    });

    describe('with a leftJoin', () => {
      it('returns sql', () => {
        expect(queryBuilder.select().from('from-table')
          .leftJoins([{foreignTable: 'foreign-table', fromKey: 'from-key', foreignKey: 'foreign-key'}])
          .build())
          .toBe('SELECT * FROM `from-table` LEFT JOIN `foreign-table` ON `from-table`.`from-key` = `foreign-table`.`foreign-key`');
      });
    });
  });
});