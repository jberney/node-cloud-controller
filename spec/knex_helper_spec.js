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
        let prevIdQuery;

        beforeEach.async(async () => {
          const prevIdQueryMethods = ['from', 'limit', 'offset', 'orderBy'];
          prevIdQuery = jasmine.createSpyObj('query', prevIdQueryMethods);
          prevIdQueryMethods.forEach(method => prevIdQuery[method].and.returnValue(prevIdQuery));
          prevIdQuery.offset.and.returnValue(Promise.resolve([{id: 100}]));
          knex.select.and.callFake(cols => cols === 'id' ? prevIdQuery : query);
          await knexHelper.streamPage({
            from: 'organizations',
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
          expect(query.where).toHaveBeenCalledWith('organizations.id', '>', 100);
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
        let prevIdQuery;

        beforeEach.async(async () => {
          const prevIdQueryMethods = ['from', 'limit', 'offset', 'orderBy'];
          prevIdQuery = jasmine.createSpyObj('query', prevIdQueryMethods);
          prevIdQueryMethods.forEach(method => prevIdQuery[method].and.returnValue(prevIdQuery));
          prevIdQuery.offset.and.returnValue(Promise.resolve([]));
          knex.select.and.callFake(cols => cols === 'id' ? prevIdQuery : query);
          await knexHelper.streamPage({
            from: 'organizations',
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
      let counter, actual;

      beforeEach.async(async () => {
        counter = jasmine.createSpyObj('counter', ['count']);
        counter.count.and.returnValue(Promise.resolve([{count: 123}]));
        knex.and.returnValue(counter);
        actual = await knexHelper.tableCount('some-table');
      });

      it('selects on the table', () => {
        expect(knex).toHaveBeenCalledWith('some-table');
      });

      it('counts is as count', () => {
        expect(counter.count).toHaveBeenCalledWith('id as count');
      });

      it('returns the count', () => {
        expect(actual).toBe(123);
      });
    });
  });
});