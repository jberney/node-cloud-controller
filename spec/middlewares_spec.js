require('./spec_helper');

describe('Middlewares', () => {
  let Middlewares, res;

  beforeEach(() => {
    Middlewares = require('../src/middlewares');
    res = jasmine.createSpyObj('res', ['end', 'send', 'write', 'writeHead']);
  });

  describe('info', () => {
    let info;

    beforeEach(() => {
      info = {api_version: '2.98.0'};
      Middlewares.new({info}).info(null, res);
    });

    it('sends info', () => {
      expect(res.send).toHaveBeenCalledWith(info);
    });
  });

  describe('listAll', () => {
    describe('when the type is invalid', () => {
      let next;

      beforeEach(() => {
        next = jasmine.createSpy('next');
        Middlewares.new({}).listAll({params: {}}, null, next);
      });

      it('calls next', () => {
        expect(next).toHaveBeenCalledWith();
      });
    });

    describe('when there is an error acquiring a connection', () => {
      let pool, SqlDriver, error, res, caught;

      beforeEach.async(async () => {
        pool = jasmine.createSpy('pool');
        SqlDriver = jasmine.createSpyObj('SqlDriver', ['getConnection']);
        error = 'failed to acquire a connection';
        SqlDriver.getConnection.and.returnValue(Promise.reject(error));
        res = jasmine.createSpyObj('res', ['end']);
        try {
          await Middlewares.new({pool, SqlDriver}).listAll({params: {type: 'organizations'}}, res);
        } catch (e) {
          caught = e;
        }
      });

      it('gets a connection', () => {
        expect(SqlDriver.getConnection).toHaveBeenCalledWith(pool);
      });

      it('ends the response', () => {
        expect(res.end).toHaveBeenCalledWith();
      });

      it('throws the error', () => {
        expect(caught).toBe(error);
      });
    });

    describe('when there is an error getting the count', () => {
      let pool, SqlDriver, connection, error, res, caught;

      beforeEach.async(async () => {
        pool = jasmine.createSpy('pool');
        SqlDriver = jasmine.createSpyObj('SqlDriver', ['count', 'getConnection']);
        connection = jasmine.createSpyObj('connection', ['release']);
        SqlDriver.getConnection.and.returnValue(Promise.resolve(connection));
        error = 'failed to get the count';
        SqlDriver.count.and.returnValue(Promise.reject(error));
        res = jasmine.createSpyObj('res', ['end']);
        try {
          await Middlewares.new({pool, SqlDriver}).listAll({params: {type: 'organizations'}}, res);
        } catch (e) {
          caught = e;
        }
      });

      it('gets a connection', () => {
        expect(SqlDriver.getConnection).toHaveBeenCalledWith(pool);
      });

      it('gets the count', () => {
        expect(SqlDriver.count).toHaveBeenCalledWith({connection, from: 'organizations'});
      });

      it('releases the connection', () => {
        expect(connection.release).toHaveBeenCalledWith();
      });

      it('ends the response', () => {
        expect(res.end).toHaveBeenCalledWith();
      });

      it('throws the error', () => {
        expect(caught).toBe(error);
      });
    });

    describe('when there are no rows to write', () => {
      let pool, SqlDriver, connection, res;

      beforeEach.async(async () => {
        pool = jasmine.createSpy('pool');
        SqlDriver = jasmine.createSpyObj('SqlDriver', ['count', 'getConnection']);
        connection = jasmine.createSpyObj('connection', ['release']);
        SqlDriver.getConnection.and.returnValue(Promise.resolve(connection));
        SqlDriver.count.and.returnValue(Promise.resolve(0));
        res = jasmine.createSpyObj('res', ['end', 'writeHead', 'write']);
        await Middlewares.new({pool, SqlDriver}).listAll({params: {type: 'organizations'}}, res);
      });

      it('gets a connection', () => {
        expect(SqlDriver.getConnection).toHaveBeenCalledWith(pool);
      });

      it('gets the count', () => {
        expect(SqlDriver.count).toHaveBeenCalledWith({connection, from: 'organizations'});
      });

      it('writes the headers', () => {
        expect(res.writeHead).toHaveBeenCalledWith(200, {'Content-Type': 'application/json'});
      });

      it('writes the start of the json object', () => {
        expect(res.write).toHaveBeenCalledWith('{"total_results":0,"total_pages":0,"prev_url":null,"next_url":null,"resources":[');
      });

      it('writes the end of the json object', () => {
        expect(res.write).toHaveBeenCalledWith(']}');
      });

      it('releases the connection', () => {
        expect(connection.release).toHaveBeenCalledWith();
      });

      it('ends the response', () => {
        expect(res.end).toHaveBeenCalledWith();
      });
    });

    describe('when writing rows fails', () => {
      let entity, from, pool, SqlDriver, connection, error, res, caught;

      beforeEach.async(async () => {
        const entities = require('../src/entities');
        from = 'organizations';
        entity = entities[from];
        pool = jasmine.createSpy('pool');
        SqlDriver = jasmine.createSpyObj('SqlDriver', ['count', 'getConnection', 'writeRows']);
        connection = jasmine.createSpyObj('connection', ['release']);
        SqlDriver.getConnection.and.returnValue(Promise.resolve(connection));
        SqlDriver.count.and.returnValue(Promise.resolve(150));
        error = 'failed to write rows';
        SqlDriver.writeRows.and.returnValue(Promise.reject(error));
        res = jasmine.createSpyObj('res', ['end', 'writeHead', 'write']);
        try {
          await Middlewares.new({pool, SqlDriver}).listAll({params: {type: 'organizations'}}, res);
        } catch (e) {
          caught = e;
        }
      });

      it('gets a connection', () => {
        expect(SqlDriver.getConnection).toHaveBeenCalledWith(pool);
      });

      it('gets the count', () => {
        expect(SqlDriver.count).toHaveBeenCalledWith({connection, from: 'organizations'});
      });

      it('writes the headers', () => {
        expect(res.writeHead).toHaveBeenCalledWith(200, {'Content-Type': 'application/json'});
      });

      it('writes the start of the json object', () => {
        expect(res.write).toHaveBeenCalledWith('{"total_results":150,"total_pages":2,"prev_url":null,"next_url":null,"resources":[');
      });

      it('writes rows', () => {
        expect(SqlDriver.writeRows).toHaveBeenCalledWith({connection, entity, from, res});
      });

      it('releases the connection', () => {
        expect(connection.release).toHaveBeenCalledWith();
      });

      it('ends the response', () => {
        expect(res.end).toHaveBeenCalledWith();
      });

      it('throws the error', () => {
        expect(caught).toBe(error);
      });
    });
  });
});