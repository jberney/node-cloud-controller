require('./spec_helper');

describe('MySqlDriver', () => {
  let MySqlDriver;

  beforeEach(() => {
    MySqlDriver = require('../src/mysql_driver');
  });

  describe('count', () => {
    let from, connection;

    beforeEach(() => {
      from = 'organizations';
      connection = jasmine.createSpyObj('connection', ['query']);
    });

    describe('when there is an error', () => {
      let caught;

      beforeEach.async(async () => {
        connection.query.and.callFake((sql, bindings, cb) => cb('failed to retrieve count'));
        try {
          await MySqlDriver.count({connection, from});
        } catch (e) {
          caught = e;
        }
      });

      it('queries the count', () => {
        expect(connection.query).toHaveBeenCalledWith('SELECT COUNT(*) AS count FROM ??', [from], jasmine.any(Function));
      });

      it('throws the error', () => {
        expect(caught).toBe('failed to retrieve count');
      });
    });

    describe('when there is no error', () => {
      let count, actual;

      beforeEach.async(async () => {
        connection.query.and.callFake((sql, bindings, cb) => cb(null, [{count}]));
        actual = await MySqlDriver.count({connection, from});
      });

      it('queries the count', () => {
        expect(connection.query).toHaveBeenCalledWith('SELECT COUNT(*) AS count FROM ??', [from], jasmine.any(Function));
      });

      it.async('returns the count', async () => {
        expect(actual).toBe(count);
      });
    });
  });

  describe('getConnection', () => {
    let pool;

    beforeEach(() => {
      pool = jasmine.createSpyObj('pool', ['getConnection']);
    });

    describe('when there is an error', () => {
      let caught;

      beforeEach.async(async () => {
        pool.getConnection.and.callFake(cb => cb('failed to get connection'));
        try {
          await MySqlDriver.getConnection(pool);
        } catch (e) {
          caught = e;
        }
      });

      it('gets a connection', () => {
        expect(pool.getConnection).toHaveBeenCalledWith(jasmine.any(Function));
      });

      it('throws the error', () => {
        expect(caught).toBe('failed to get connection');
      });
    });

    describe('when there is no error', () => {
      let connection, actual;

      beforeEach.async(async () => {
        connection = jasmine.createSpy('connection');
        pool.getConnection.and.callFake(cb => cb(null, connection));
        actual = await MySqlDriver.getConnection(pool);
      });

      it('gets a connection', () => {
        expect(pool.getConnection).toHaveBeenCalledWith(jasmine.any(Function));
      });

      it('returns the connection', () => {
        expect(actual).toBe(connection);
      });
    });
  });


  describe('writeRows', () => {
    let ServerHelper, writeRow, entity, connection, query, listeners, res, from, promise;

    beforeEach(() => {
      ServerHelper = require('../src/server_helper');

      writeRow = jasmine.createSpy();
      spyOn(ServerHelper, 'writeRow').and.returnValue(writeRow);

      entity = {name: {}, billing_enabled: {type: 'boolean'}, status: {}};

      connection = jasmine.createSpyObj('connection', ['pause', 'query', 'release', 'resume']);
      query = jasmine.createSpyObj('query', ['on']);
      listeners = {};
      query.on.and.callFake((event, cb) => (listeners[event] = cb, query));
      connection.query.and.returnValue(query);
      res = jasmine.createSpyObj('res', ['end', 'write', 'writeHead']);
      from = 'organizations';
      promise = MySqlDriver.writeRows({connection, entity, from, res});
    });

    it('queries the database', () => {
      expect(connection.query).toHaveBeenCalledWith({
        sql: `SELECT \`organizations\`.\`name\`,\`organizations\`.\`billing_enabled\`,\`quota_definitions\`.\`guid\`,\`organizations\`.\`status\`,\`organizations\`.\`guid\` FROM \`${from}\` LEFT JOIN \`quota_definitions\` ON \`${from}\`.\`quota_definition_id\` = \`quota_definitions\`.\`id\` LIMIT 100`,
        nestTables: true
      });
    });

    it('listens for results', () => {
      expect(query.on).toHaveBeenCalledWith('result', jasmine.any(Function));
    });

    it('listens for the end', () => {
      expect(query.on).toHaveBeenCalledWith('end', jasmine.any(Function));
    });

    describe('when a result is emitted', () => {
      let row;

      beforeEach(() => {
        row = {organizations: {guid: 'some-org-guid'}, quota_definitions: {guid: 'some-quota-definition-guid'}};
        writeRow.and.callFake(cb => cb('some-data'));
        res.write.and.callFake((data, cb) => cb());

        listeners.result(row);
      });

      it('pauses the sql connection', () => {
        expect(connection.pause).toHaveBeenCalledWith();
      });

      it('writes the row', () => {
        expect(ServerHelper.writeRow).toHaveBeenCalledWith({prefix: undefined, from, row});
        expect(writeRow).toHaveBeenCalledWith(jasmine.any(Function));
        expect(res.write).toHaveBeenCalledWith('some-data', jasmine.any(Function));
      });

      it('resumes the sql connection', () => {
        expect(connection.resume).toHaveBeenCalledWith();
      });

      describe('when another result is emitted', () => {
        let row2;

        beforeEach(() => {
          row2 = {organizations: {guid: 'some-other-org-guid'}};
          writeRow.and.callFake(cb => cb('some-other-data'));
          res.write.and.callFake((data, cb) => cb());

          connection.pause.calls.reset();
          ServerHelper.writeRow.calls.reset();
          writeRow.calls.reset();
          res.write.calls.reset();
          connection.resume.calls.reset();

          listeners.result(row2);
        });

        it('pauses the sql connection', () => {
          expect(connection.pause).toHaveBeenCalledWith();
        });

        it('writes the row', () => {
          expect(ServerHelper.writeRow).toHaveBeenCalledWith({prefix: ',', from, row: row2});
          expect(writeRow).toHaveBeenCalledWith(jasmine.any(Function));
          expect(res.write).toHaveBeenCalledWith('some-other-data', jasmine.any(Function));
        });

        it('resumes the sql connection', () => {
          expect(connection.resume).toHaveBeenCalledWith();
        });
      });
    });

    describe('when the end is emitted', () => {
      beforeEach(() => {
        listeners.end();
      });

      it.async('returns undefined', async () => {
        expect(await promise).toBeUndefined();
      });
    });
  });
});