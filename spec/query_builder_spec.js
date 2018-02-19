require('./spec_helper');

describe('QueryBuilder', () => {
  let QueryBuilder;

  beforeEach(() => {
    QueryBuilder = require('../src/query_builder');
  });

  describe('select', () => {
    describe('basic', () => {
      it('returns sql', () => {
        expect(QueryBuilder.select().from('from-table').build()).toBe('SELECT * FROM `from-table`');
      });
    });

    describe('with columns', () => {
      it('returns sql', () => {
        expect(QueryBuilder.select(['from-table.from-key']).from('from-table').build()).toBe('SELECT `from-table`.`from-key` FROM `from-table`');
      });
    });

    describe('with a leftJoin', () => {
      it('returns sql', () => {
        expect(QueryBuilder.select().from('from-table')
          .leftJoins([{foreignTable: 'foreign-table', fromKey: 'from-key', foreignKey: 'foreign-key'}])
          .build())
          .toBe('SELECT * FROM `from-table` LEFT JOIN `foreign-table` ON `from-table`.`from-key` = `foreign-table`.`foreign-key`');
      });
    });

    describe('with two leftJoins', () => {
      it('returns sql', () => {
        expect(QueryBuilder.select().from('from-table')
          .leftJoins([
            {foreignTable: 'foreign-table-1', fromKey: 'from-key-1', foreignKey: 'foreign-key-1'},
            {foreignTable: 'foreign-table-2', fromKey: 'from-key-2', foreignKey: 'foreign-key-2'}
          ])
          .build())
          .toBe('SELECT * FROM `from-table` LEFT JOIN `foreign-table-1` ON `from-table`.`from-key-1` = `foreign-table-1`.`foreign-key-1` LEFT JOIN `foreign-table-2` ON `from-table`.`from-key-2` = `foreign-table-2`.`foreign-key-2`');
      });
    });

    describe('with a where', () => {
      it('returns sql', () => {
        expect(QueryBuilder.select().from('from-table')
          .where('from-table.from-key', '>', 99)
          .build())
          .toBe('SELECT * FROM `from-table` WHERE `from-table`.`from-key` > 99');
      });
    });

    describe('with an orderBy', () => {
      it('returns sql', () => {
        expect(QueryBuilder.select().from('from-table')
          .orderBy('order-by-col')
          .build())
          .toBe('SELECT * FROM `from-table` ORDER BY `order-by-col` ASC');
      });
    });

    describe('with an orderBy asc', () => {
      it('returns sql', () => {
        expect(QueryBuilder.select().from('from-table')
          .orderBy('order-by-col', 'asc')
          .build())
          .toBe('SELECT * FROM `from-table` ORDER BY `order-by-col` ASC');
      });
    });

    describe('with an orderBy desc', () => {
      it('returns sql', () => {
        expect(QueryBuilder.select().from('from-table')
          .orderBy('order-by-col', 'desc')
          .build())
          .toBe('SELECT * FROM `from-table` ORDER BY `order-by-col` DESC');
      });
    });

    describe('with a limit', () => {
      it('returns sql', () => {
        expect(QueryBuilder.select().from('from-table')
          .limit(100)
          .build())
          .toBe('SELECT * FROM `from-table` LIMIT 100');
      });
    });

    describe('with an offset', () => {
      it('returns sql', () => {
        expect(QueryBuilder.select().from('from-table')
          .offset(99)
          .build())
          .toBe('SELECT * FROM `from-table` OFFSET 99');
      });
    });
  });
});