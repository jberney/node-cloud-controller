describe('Index', () => {
  let express, Server, MySqlDriver, entities, server, sqlDriver, host, user, password, database, info;

  beforeAll(() => {
    express = require('express');

    MySqlDriver = require('../src/mysql_driver');
    sqlDriver = jasmine.createSpy('sqlDriver');
    spyOn(MySqlDriver, 'new').and.returnValue(sqlDriver);

    entities = require('../src/entities');

    Server = require('../src/server');
    server = jasmine.createSpyObj('server', ['listen']);
    spyOn(Server, 'new').and.returnValue(server);

    host = 'some-sql-host';
    user = 'some-sql-host';
    password = 'some-sql-host';
    database = 'some-sql-host';
    info = {
      api_version: '2.98.0',
      authorization_endpoint: 'some-auth-endpoint'
    };

    process.env.SQL_HOST = host;
    process.env.SQL_USER = user;
    process.env.SQL_PASSWORD = password;
    process.env.SQL_DATABASE = database;
    process.env.AUTHORIZATION_ENDPOINT = info.authorization_endpoint;
    process.env.PORT = 8000;

    require('../src/index');
  });

  it('creates a mysql driver', () => {
    expect(MySqlDriver.new).toHaveBeenCalledWith({entities, config: {host, user, password, database}});
  });

  it('creates a server', () => {
    expect(Server.new).toHaveBeenCalledWith({express, sqlDriver, info});
  });

  it('listens on port 8000', () => {
    expect(server.listen).toHaveBeenCalledWith('8000');
  });
});