require('./spec_helper');

describe('Index', () => {
  let express, mysql, Middlewares, MySqlDriver, Server, pool, middlewares, server, host, user, password, database, info;

  beforeAll(() => {
    express = require('express');
    mysql = require('mysql');
    Middlewares = require('../src/middlewares');
    MySqlDriver = require('../src/mysql_driver');
    Server = require('../src/server');

    pool = jasmine.createSpy('pool');
    spyOn(mysql, 'createPool').and.returnValue(pool);

    middlewares = jasmine.createSpy('middlewares');
    spyOn(Middlewares, 'new').and.returnValue(middlewares);

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

  it('creates a mysql pool', () => {
    expect(mysql.createPool).toHaveBeenCalledWith({host, user, password, database});
  });

  it('creates middlewares', () => {
    expect(Middlewares.new).toHaveBeenCalledWith({info, pool, SqlDriver: MySqlDriver});
  });

  it('creates a server', () => {
    expect(Server.new).toHaveBeenCalledWith({express, middlewares});
  });

  it('listens on port 8000', () => {
    expect(server.listen).toHaveBeenCalledWith('8000');
  });
});