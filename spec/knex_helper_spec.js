require('./spec_helper');

describe('KnexHelper', () => {
  let KnexHelper, StreamHelper, knex;

  beforeEach(() => {
    KnexHelper = require('../src/knex_helper');
    StreamHelper = require('../src/stream_helper');
    spyOn(StreamHelper, 'newWritableStream');

    knex = require('knex');
  });

  describe('knex', () => {
    it('returns knex', () => {
      expect(KnexHelper.knex).toBe(knex);
    });
  });

  describe('new', () => {
    let knexHelper;

    beforeEach(() => {
      knex = jasmine.createSpy('knex');
      knexHelper = KnexHelper.new(knex);
    });

    describe('streamPage', () => {
      let query, write, readableStream, writableStream;

      beforeEach(() => {
        const queryMethods = ['from', 'leftJoin', 'limit', 'orderBy', 'stream', 'where'];
        query = jasmine.createSpyObj('query', queryMethods);
        queryMethods.forEach(method => query[method].and.returnValue(query));
        knex.select = jasmine.createSpy('select').and.returnValue(query);
        write = jasmine.createSpy('write');
        readableStream = jasmine.createSpyObj('readableStream', ['pipe']);
        query.stream.and.callFake(cb => cb(readableStream));
        writableStream = jasmine.createSpy('writableStream');
        StreamHelper.newWritableStream.and.returnValue(writableStream);
      });

      describe('page = #1', () => {
        beforeEach.async(async () => {
          await knexHelper.streamPage({
            from: 'organizations',
            q: ['id', '>', '123'],
            page: 1,
            perPage: 100,
            orderBy: 'organizations.id',
            orderDir: 'asc',
            write
          });
        });

        it('selects columns', () => {
          expect(knex.select).toHaveBeenCalledWith({
            'organizations.name': 'organizations.name',
            'organizations.billing_enabled': 'organizations.billing_enabled',
            'quota_definitions.guid': 'quota_definitions.guid',
            'organizations.status': 'organizations.status',
            'organizations.guid': 'organizations.guid',
            'organizations.created_at': 'organizations.created_at',
            'organizations.updated_at': 'organizations.updated_at'
          });
        });

        it('selects from the table', () => {
          expect(query.from).toHaveBeenCalledWith('organizations');
        });

        it('orders results by a column with a direction', () => {
          expect(query.orderBy).toHaveBeenCalledWith('organizations.id', 'asc');
        });

        it('limits the result set', () => {
          expect(query.limit).toHaveBeenCalledWith(100);
        });

        it('left joins', () => {
          expect(query.leftJoin).toHaveBeenCalledWith('quota_definitions', 'organizations.quota_definition_id', 'quota_definitions.id');
        });

        it('filters', () => {
          expect(query.where).toHaveBeenCalledWith('organizations.id', '>', 123);
        });

        it('streams the query', () => {
          expect(query.stream).toHaveBeenCalledWith(jasmine.any(Function));
        });

        it('creates a new writable stream', () => {
          expect(StreamHelper.newWritableStream).toHaveBeenCalledWith(write);
        });

        it('pipes the readable stream to the writable stream', () => {
          expect(readableStream.pipe).toHaveBeenCalledWith(writableStream);
        });
      });

      describe('page > #1', () => {
        let prevIdQuery, promise;

        beforeEach.async(async () => {
          const prevIdQueryMethods = ['from', 'limit', 'offset', 'orderBy'];
          prevIdQuery = jasmine.createSpyObj('query', prevIdQueryMethods);
          prevIdQueryMethods.forEach(method => prevIdQuery[method].and.returnValue(prevIdQuery));
          promise = Promise.resolve([{id: 223}]);
          promise.where = jasmine.createSpy('where');
          prevIdQuery.offset.and.returnValue(promise);
          knex.select.and.callFake(cols => cols === 'id' ? prevIdQuery : query);
          await knexHelper.streamPage({
            from: 'organizations',
            q: ['id', '>', '123'],
            page: 2,
            perPage: 100,
            orderBy: 'organizations.id',
            orderDir: 'asc',
            write
          });
        });

        it('selects a column for the prev id query', () => {
          expect(knex.select).toHaveBeenCalledWith('id');
        });

        it('selects from the table for the prev id query', () => {
          expect(prevIdQuery.from).toHaveBeenCalledWith('organizations');
        });

        it('orders results by a column with a direction for the prev id query', () => {
          expect(prevIdQuery.orderBy).toHaveBeenCalledWith('organizations.id', 'asc');
        });

        it('limits the result set for the prev id query', () => {
          expect(prevIdQuery.limit).toHaveBeenCalledWith(1);
        });

        it('offsets the result set for the prev id query', () => {
          expect(prevIdQuery.offset).toHaveBeenCalledWith(99);
        });

        it('filters prev id query', () => {
          expect(promise.where).toHaveBeenCalledWith('organizations.id', '>', 123);
        });

        it('selects columns', () => {
          expect(knex.select).toHaveBeenCalledWith({
            'organizations.name': 'organizations.name',
            'organizations.billing_enabled': 'organizations.billing_enabled',
            'quota_definitions.guid': 'quota_definitions.guid',
            'organizations.status': 'organizations.status',
            'organizations.guid': 'organizations.guid',
            'organizations.created_at': 'organizations.created_at',
            'organizations.updated_at': 'organizations.updated_at'
          });
        });

        it('selects from the table', () => {
          expect(query.from).toHaveBeenCalledWith('organizations');
        });

        it('orders results by a column with a direction', () => {
          expect(query.orderBy).toHaveBeenCalledWith('organizations.id', 'asc');
        });

        it('limits the result set', () => {
          expect(query.limit).toHaveBeenCalledWith(100);
        });

        it('left joins', () => {
          expect(query.leftJoin).toHaveBeenCalledWith('quota_definitions', 'organizations.quota_definition_id', 'quota_definitions.id');
        });

        it('filters the result set', () => {
          expect(query.where).toHaveBeenCalledWith('organizations.id', '>', 223);
        });

        it('streams the query', () => {
          expect(query.stream).toHaveBeenCalledWith(jasmine.any(Function));
        });

        it('creates a new writable stream', () => {
          expect(StreamHelper.newWritableStream).toHaveBeenCalledWith(write);
        });

        it('pipes the readable stream to the writable stream', () => {
          expect(readableStream.pipe).toHaveBeenCalledWith(writableStream);
        });
      });

      describe('page > total pages', () => {
        let prevIdQuery, promise;

        beforeEach.async(async () => {
          const prevIdQueryMethods = ['from', 'limit', 'offset', 'orderBy'];
          prevIdQuery = jasmine.createSpyObj('query', prevIdQueryMethods);
          prevIdQueryMethods.forEach(method => prevIdQuery[method].and.returnValue(prevIdQuery));
          promise = Promise.resolve([]);
          promise.where = jasmine.createSpy('where');
          prevIdQuery.offset.and.returnValue(promise);
          knex.select.and.callFake(cols => cols === 'id' ? prevIdQuery : query);
          await knexHelper.streamPage({
            from: 'organizations',
            q: ['id', '>', '123'],
            page: 3,
            perPage: 100,
            orderBy: 'organizations.id',
            orderDir: 'asc',
            write
          });
        });

        it('selects a column for the prev id query', () => {
          expect(knex.select).toHaveBeenCalledWith('id');
        });

        it('selects from the table for the prev id query', () => {
          expect(prevIdQuery.from).toHaveBeenCalledWith('organizations');
        });

        it('orders results by a column with a direction for the prev id query', () => {
          expect(prevIdQuery.orderBy).toHaveBeenCalledWith('organizations.id', 'asc');
        });

        it('limits the result set for the prev id query', () => {
          expect(prevIdQuery.limit).toHaveBeenCalledWith(1);
        });

        it('offsets the result set for the prev id query', () => {
          expect(prevIdQuery.offset).toHaveBeenCalledWith(199);
        });

        it('filters prev id query', () => {
          expect(promise.where).toHaveBeenCalledWith('organizations.id', '>', 123);
        });

        it('selects columns', () => {
          expect(knex.select).toHaveBeenCalledWith({
            'organizations.name': 'organizations.name',
            'organizations.billing_enabled': 'organizations.billing_enabled',
            'quota_definitions.guid': 'quota_definitions.guid',
            'organizations.status': 'organizations.status',
            'organizations.guid': 'organizations.guid',
            'organizations.created_at': 'organizations.created_at',
            'organizations.updated_at': 'organizations.updated_at'
          });
        });

        it('selects from the table', () => {
          expect(query.from).toHaveBeenCalledWith('organizations');
        });

        it('orders results by a column with a direction', () => {
          expect(query.orderBy).toHaveBeenCalledWith('organizations.id', 'asc');
        });

        it('limits the result set', () => {
          expect(query.limit).toHaveBeenCalledWith(100);
        });

        it('left joins', () => {
          expect(query.leftJoin).toHaveBeenCalledWith('quota_definitions', 'organizations.quota_definition_id', 'quota_definitions.id');
        });

        it('filters the result set', () => {
          expect(query.where).toHaveBeenCalledWith('organizations.id', '>', null);
        });

        it('streams the query', () => {
          expect(query.stream).toHaveBeenCalledWith(jasmine.any(Function));
        });

        it('creates a new writable stream', () => {
          expect(StreamHelper.newWritableStream).toHaveBeenCalledWith(write);
        });

        it('pipes the readable stream to the writable stream', () => {
          expect(readableStream.pipe).toHaveBeenCalledWith(writableStream);
        });
      });
    });

    describe('tableCount', () => {
      let counter, promise, actual;

      beforeEach.async(async () => {
        counter = jasmine.createSpyObj('counter', ['count']);
        knex.and.returnValue(counter);
        promise = Promise.resolve([{count: 123}]);
        promise.where = jasmine.createSpy('where');
        promise.whereIn = jasmine.createSpy('whereIn');
        counter.count.and.returnValue(promise);
      });

      describe('without filters', () => {
        beforeEach.async(async () => {
          actual = await knexHelper.tableCount({from: 'some-table'});
        });

        it('selects on the table', () => {
          expect(knex).toHaveBeenCalledWith('some-table');
        });

        it('counts id as count', () => {
          expect(counter.count).toHaveBeenCalledWith('id as count');
        });

        it('does not filter', () => {
          expect(promise.where).not.toHaveBeenCalled();
        });

        it('returns the count', () => {
          expect(actual).toBe(123);
        });
      });

      describe('with a ":" filter', () => {
        beforeEach.async(async () => {
          actual = await knexHelper.tableCount({from: 'some-table', q: ['filter', ':', 'value']});
        });

        it('selects on the table', () => {
          expect(knex).toHaveBeenCalledWith('some-table');
        });

        it('counts id as count', () => {
          expect(counter.count).toHaveBeenCalledWith('id as count');
        });

        it('filters', () => {
          expect(promise.where).toHaveBeenCalledWith('some-table.filter', 'value');
        });

        it('returns the count', () => {
          expect(actual).toBe(123);
        });
      });

      describe('with a ":" filter', () => {
        beforeEach.async(async () => {
          actual = await knexHelper.tableCount({from: 'some-table', q: ['filter', ' IN ', 'value1,value2']});
        });

        it('selects on the table', () => {
          expect(knex).toHaveBeenCalledWith('some-table');
        });

        it('counts id as count', () => {
          expect(counter.count).toHaveBeenCalledWith('id as count');
        });

        it('filters', () => {
          expect(promise.whereIn).toHaveBeenCalledWith('some-table.filter', ['value1', 'value2']);
        });

        it('returns the count', () => {
          expect(actual).toBe(123);
        });
      });

      describe('with a mathematical comparison filter', () => {
        beforeEach.async(async () => {
          actual = await knexHelper.tableCount({from: 'some-table', q: ['filter', '>', '32']});
        });

        it('selects on the table', () => {
          expect(knex).toHaveBeenCalledWith('some-table');
        });

        it('counts id as count', () => {
          expect(counter.count).toHaveBeenCalledWith('id as count');
        });

        it('filters', () => {
          expect(promise.where).toHaveBeenCalledWith('some-table.filter', '>', 32);
        });

        it('returns the count', () => {
          expect(actual).toBe(123);
        });
      });

      describe('with an invalid filter', () => {
        beforeEach.async(async () => {
          actual = await knexHelper.tableCount({from: 'some-table', q: ['filter', 'invalid-operator', 'value']});
        });

        it('selects on the table', () => {
          expect(knex).toHaveBeenCalledWith('some-table');
        });

        it('counts id as count', () => {
          expect(counter.count).toHaveBeenCalledWith('id as count');
        });

        it('does not filter', () => {
          expect(promise.where).not.toHaveBeenCalled();
        });

        it('returns the count', () => {
          expect(actual).toBe(123);
        });
      });
    });
  });
});