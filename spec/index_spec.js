require('./spec_helper');

describe('Index', () => {
  let express, KnexHelper, Middlewares, Server, knex, knexHelper, middlewares, server, host, user, password, database,
    info;

  beforeAll(() => {
    express = require('express');
    KnexHelper = require('../src/knex_helper');
    Middlewares = require('../src/middlewares');
    Server = require('../src/server');

    knex = jasmine.createSpy('knex');
    spyOn(KnexHelper, 'knex').and.returnValue(knex);
    knexHelper = jasmine.createSpy('knexHelper');
    spyOn(KnexHelper, 'new').and.returnValue(knexHelper);

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

  it('initializes knex', () => {
    expect(KnexHelper.knex).toHaveBeenCalledWith({client: 'mysql2', connection: {host, user, password, database}});
  });

  it('creates knexHelper', () => {
    expect(KnexHelper.new).toHaveBeenCalledWith(knex);
  });

  it('creates middlewares', () => {
    expect(Middlewares.new).toHaveBeenCalledWith({info, knexHelper});
  });

  it('creates a server', () => {
    expect(Server.new).toHaveBeenCalledWith({express, middlewares});
  });

  it('listens on port 8000', () => {
    expect(server.listen).toHaveBeenCalledWith('8000');
  });
});