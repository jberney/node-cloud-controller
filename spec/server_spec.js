require('./spec_helper');

describe('Server', () => {
  let Server, app, gets, express, middlewares, server;

  beforeAll(() => {
    Server = require('../src/server');

    app = jasmine.createSpyObj('app', ['get']);
    gets = {};
    app.get.and.callFake((url, ...middlewares) => (gets[url] = middlewares, app));
    express = jasmine.createSpy('express').and.returnValue(app);
    middlewares = jasmine.createSpyObj('middlewares', ['info', 'listAll']);

    server = Server.new({express, middlewares});
  });

  it('creates an express app', () => expect(express).toHaveBeenCalledWith());

  it('returns a server', () => expect(server).toBe(app));

  it('GET /v2/info', () => {
    expect(gets['/v2/info'].length).toBe(1);
    expect(gets['/v2/info'][0]).toBe(middlewares.info);
  });

  it('GET /v2/:from', () => {
    expect(gets['/v2/:from'].length).toBe(2);
    expect(gets['/v2/:from'][0]).toBe(middlewares.requireMetadata);
    expect(gets['/v2/:from'][1]).toBe(middlewares.listAll);
  });
});