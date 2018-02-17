describe('MySqlDriver', () => {
  let ServerHelper, writeRow, mysql, pool, MySqlDriver, config, sqlDriver;

  beforeEach(() => {
    ServerHelper = require('../src/server_helper');
    writeRow = jasmine.createSpy();
    spyOn(ServerHelper, 'writeRow').and.returnValue(writeRow);

    mysql = require('mysql');
    MySqlDriver = require('../src/mysql_driver');

    pool = jasmine.createSpyObj('pool', ['getConnection']);
    spyOn(mysql, 'createPool').and.returnValue(pool);

    config = {host: 'some-host', user: 'some-user', password: 'some-password', database: 'some-db'};

    sqlDriver = MySqlDriver.new(config);
  });

  it('creates a pool', () => {
    expect(mysql.createPool).toHaveBeenCalledWith(config);
  });

  describe('writeList', () => {
    describe('when db conn fails', () => {
      let error, caught;

      beforeEach(() => {
        error = 'connection failed!';
        pool.getConnection.and.callFake(cb => cb(error));

        try {
          sqlDriver.writeList({})();
        } catch (e) {
          caught = e;
        }
      });

      it('requests a db connection from the pool', () => {
        expect(pool.getConnection).toHaveBeenCalledWith(jasmine.any(Function));
      });

      it('throws the error', () => {
        expect(caught).toBe(error);
      });
    });
  });

  describe('when db conn succeeds', () => {
    let connection, query, listeners, res, from, entity;

    beforeEach(() => {
      connection = jasmine.createSpyObj('connection', ['pause', 'query', 'release', 'resume']);
      query = jasmine.createSpyObj('query', ['on']);
      listeners = {};
      query.on.and.callFake((event, cb) => (listeners[event] = cb, query));
      connection.query.and.returnValue(query);
      pool.getConnection.and.callFake(cb => cb(null, connection));
      res = jasmine.createSpyObj('res', ['end', 'write', 'writeHead']);
      from = 'organizations';
    });

    describe('with a basic query', () => {
      beforeEach(() => {
        entity = {
          name: {},
          billing_enabled: {type: 'boolean'},
          status: {}
        };
        sqlDriver.writeList({from, entity})(null, res);
      });

      it('sets status and writes headers', () => {
        expect(res.writeHead).toHaveBeenCalledWith(200, {'Content-Type': 'application/json'});
      });

      it('writes the resources key', () => {
        expect(res.write).toHaveBeenCalledWith('{"resources":[');
      });

      it('queries the database', () => {
        expect(connection.query).toHaveBeenCalledWith({sql: `SELECT * FROM \`${from}\``, nestTables: true});
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
          row = {
            organizations: {
              guid: 'some-org-guid'
            },
            quota_definitions: {
              guid: 'some-quota-definition-guid'
            }
          };
          writeRow.and.callFake(cb => cb('some-data'));
          res.write.and.callFake((data, cb) => cb());

          listeners.result(row);
        });

        it('pauses the sql connection', () => {
          expect(connection.pause).toHaveBeenCalledWith();
        });

        it('writes the row', () => {
          expect(ServerHelper.writeRow).toHaveBeenCalledWith({entity, prefix: undefined, from, row});
          expect(writeRow).toHaveBeenCalledWith(jasmine.any(Function));
          expect(res.write).toHaveBeenCalledWith('some-data', jasmine.any(Function));
        });

        it('resumes the sql connection', () => {
          expect(connection.resume).toHaveBeenCalledWith();
        });

        describe('when another result is emitted', () => {
          let row2;

          beforeEach(() => {
            row2 = {
              organizations: {
                guid: 'some-other-org-guid'
              },
              quota_definitions: {
                guid: 'some-other-quota-definition-guid'
              }
            };
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
            expect(ServerHelper.writeRow).toHaveBeenCalledWith({entity, prefix: ',', from, row: row2});
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

        it('releases the connection', () => {
          expect(connection.release).toHaveBeenCalledWith();
        });

        it('writes the end of the json', () => {
          expect(res.write).toHaveBeenCalledWith(']}');
        });

        it('ends the response', () => {
          expect(res.end).toHaveBeenCalledWith();
        });
      });
    });

    describe('with left joins', () => {
      let foreignTable;

      beforeEach(() => {
        foreignTable = 'quota_definitions';
        entity = {
          name: {},
          billing_enabled: {type: 'boolean'},
          quota_definition_guid: {foreignTable, column: 'guid'},
          status: {},
          quota_definition_url: {foreignTable, column: 'guid', format: '/v2/quota_definitions/%s'}
        };
        sqlDriver.writeList({from, entity})(null, res);
      });

      it('sets status and writes headers', () => {
        expect(res.writeHead).toHaveBeenCalledWith(200, {'Content-Type': 'application/json'});
      });

      it('writes the resources key', () => {
        expect(res.write).toHaveBeenCalledWith('{"resources":[');
      });

      it('queries the database', () => {
        expect(connection.query).toHaveBeenCalledWith({
          sql: `SELECT * FROM \`${from}\` LEFT JOIN \`${foreignTable}\` ON \`${from}\`.\`quota_definition_id\` = \`${foreignTable}\`.\`id\``,
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
          row = {
            organizations: {
              guid: 'some-org-guid'
            },
            quota_definitions: {
              guid: 'some-quota-definition-guid'
            }
          };
          writeRow.and.callFake(cb => cb('some-data'));
          res.write.and.callFake((data, cb) => cb());

          listeners.result(row);
        });

        it('pauses the sql connection', () => {
          expect(connection.pause).toHaveBeenCalledWith();
        });

        it('writes the row', () => {
          expect(ServerHelper.writeRow).toHaveBeenCalledWith({entity, prefix: undefined, from, row});
          expect(writeRow).toHaveBeenCalledWith(jasmine.any(Function));
          expect(res.write).toHaveBeenCalledWith('some-data', jasmine.any(Function));
        });

        it('resumes the sql connection', () => {
          expect(connection.resume).toHaveBeenCalledWith();
        });

        describe('when another result is emitted', () => {
          let row2;

          beforeEach(() => {
            row2 = {
              organizations: {
                guid: 'some-other-org-guid'
              },
              quota_definitions: {
                guid: 'some-other-quota-definition-guid'
              }
            };
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
            expect(ServerHelper.writeRow).toHaveBeenCalledWith({entity, prefix: ',', from, row: row2});
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

        it('releases the connection', () => {
          expect(connection.release).toHaveBeenCalledWith();
        });

        it('writes the end of the json', () => {
          expect(res.write).toHaveBeenCalledWith(']}');
        });

        it('ends the response', () => {
          expect(res.end).toHaveBeenCalledWith();
        });
      });
    });
  });
});