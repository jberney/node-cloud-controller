describe('Index', () => {
  let Server, MySqlDriver, server, sqlDriver, host, user, password, database, serverInfo;

  beforeAll(() => {
    server = jasmine.createSpyObj('server', ['listen']);
    Server = require('../src/server');
    spyOn(Server, 'new').and.returnValue(server);

    sqlDriver = jasmine.createSpy('sqlDriver');
    MySqlDriver = require('../src/mysql_driver');
    spyOn(MySqlDriver, 'new').and.returnValue(sqlDriver);

    host = 'some-sql-host';
    user = 'some-sql-host';
    password = 'some-sql-host';
    database = 'some-sql-host';
    serverInfo = {
      api_version: '2.98.0',
      authorization_endpoint: 'some-auth-endpoint'
    };

    process.env.SQL_HOST = host;
    process.env.SQL_USER = user;
    process.env.SQL_PASSWORD = password;
    process.env.SQL_DATABASE = database;
    process.env.AUTHORIZATION_ENDPOINT = serverInfo.authorization_endpoint;
    process.env.PORT = 8000;

    require('../src/index');
  });

  it('creates a mysql driver', () => {
    expect(MySqlDriver.new).toHaveBeenCalledWith({host, user, password, database});
  });

  it('creates a server', () => {
    expect(Server.new).toHaveBeenCalledWith(sqlDriver, serverInfo);
  });

  it('listens on port 8000', () => {
    expect(server.listen).toHaveBeenCalledWith('8000');
  });
});