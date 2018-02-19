require('./spec_helper');

describe('Server', () => {
  let Server, app, gets, express, middlewares, server;

  beforeAll(() => {
    Server = require('../src/server');

    app = jasmine.createSpyObj('app', ['get']);
    gets = {};
    app.get.and.callFake((url, ...middlewares) => (gets[url] = middlewares, app));
    express = jasmine.createSpy('express').and.returnValue(app);
    middlewares = jasmine.createSpyObj('middlewares', ['handleError', 'info', 'listAll', 'setJsonContentType']);
    middlewares.handleError.and.callFake(middleware => middleware);

    server = Server.new({express, middlewares});
  });

  it('creates an express app', () => expect(express).toHaveBeenCalledWith());

  it('returns a server', () => expect(server).toBe(app));

  it('GET /v2/info', () => {
    expect(gets['/v2/info'].length).toBe(2);
    expect(gets['/v2/info'][0]).toBe(middlewares.setJsonContentType);
    expect(gets['/v2/info'][1]).toBe(middlewares.info);
  });

  it('GET /v2/:from', () => {
    expect(middlewares.handleError).toHaveBeenCalledWith(middlewares.listAll);
    expect(gets['/v2/:from'].length).toBe(3);
    expect(gets['/v2/:from'][0]).toBe(middlewares.requireMetadata);
    expect(gets['/v2/:from'][1]).toBe(middlewares.setJsonContentType);
    expect(gets['/v2/:from'][2]).toBe(middlewares.listAll);
  });
});