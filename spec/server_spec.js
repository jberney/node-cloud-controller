require('./spec_helper');

describe('Server', () => {
  let Server, app, gets, express, middlewares, server;

  beforeAll(() => {
    Server = require('../src/server');

    app = jasmine.createSpyObj('app', ['get']);
    gets = {};
    app.get.and.callFake((url, middleware) => (gets[url] = middleware, app));
    express = jasmine.createSpy('express').and.returnValue(app);
    middlewares = jasmine.createSpyObj('middlewares', ['info', 'listAll']);

    server = Server.new({express, middlewares});
  });

  it('creates an express app', () => expect(express).toHaveBeenCalledWith());

  it('returns a server', () => expect(server).toBe(app));

  it('GET /v2/info', () => expect(gets['/v2/info']).toBe(middlewares.info));

  it('GET /v2/organizations', () => expect(gets['/v2/:type']).toBe(middlewares.listAll));
});