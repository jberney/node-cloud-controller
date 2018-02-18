describe('Server', () => {
  let Server, app, gets, express, writeList, info, res, server;

  beforeAll(() => {
    Server = require('../src/server');

    app = jasmine.createSpyObj('app', ['get']);
    gets = {};
    app.get.and.callFake((url, middleware) => gets[url] = middleware);
    express = jasmine.createSpy('express').and.returnValue(app);
    writeList = jasmine.createSpy('writeList').and.returnValue(jasmine.createSpy());
    info = {api_version: '2.98.0'};
    res = jasmine.createSpyObj(res, ['send']);

    server = Server.new({express, sqlDriver: {writeList}, info});
  });

  it('creates an express app', () => expect(express).toHaveBeenCalledWith());

  it('returns a server', () => {
    expect(server).toBe(app);
  });

  describe('GET /v2/info', () => {
    beforeEach(() => gets['/v2/info'](null, res));

    it('responds with info', () => expect(res.send).toHaveBeenCalledWith(info));
  });

  it('GET /v2/organizations', () => expect(gets['/v2/:type']).toBe(writeList));
});