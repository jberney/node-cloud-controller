require('./spec_helper');

describe('Middlewares', () => {
  let Middlewares, ServerHelper, knexHelper, req, res, next;

  beforeEach(() => {
    Middlewares = require('../src/middlewares');
    ServerHelper = require('../src/server_helper');
    spyOn(ServerHelper, 'toV2Object');
    knexHelper = jasmine.createSpyObj('knexHelper', ['streamPage', 'tableCount']);
    req = jasmine.createSpy('req');
    res = jasmine.createSpyObj('res', ['end', 'send', 'set', 'status', 'write', 'writeHead']);
    next = jasmine.createSpy('next');
  });

  describe('handleError', () => {
    let cb;

    beforeEach(() => {
      cb = jasmine.createSpy('cb');
    });

    describe('when there is an error', () => {
      beforeEach.async(async () => {
        spyOn(console, 'error');
        cb.and.returnValue(Promise.reject('callback failed'));
        await Middlewares.new({}).handleError(cb)(req, res, next);
      });

      it('calls the callback', () => {
        expect(cb).toHaveBeenCalledWith(req, res, next);
      });

      it('logs the error', () => {
        // eslint-disable-next-line no-console
        expect(console.error).toHaveBeenCalledWith('callback failed');
      });

      it('sets the response status', () => {
        expect(res.status).toHaveBeenCalledWith(500);
      });

      it('ends the response', () => {
        expect(res.end).toHaveBeenCalledWith();
      });
    });

    describe('when there is no error', () => {
      beforeEach.async(async () => {
        spyOn(console, 'error');
        cb.and.returnValue(Promise.resolve());
        await Middlewares.new({}).handleError(cb)(req, res, next);
      });

      it('calls the callback', () => {
        expect(cb).toHaveBeenCalledWith(req, res, next);
      });

      it('does not log an error', () => {
        // eslint-disable-next-line no-console
        expect(console.error).not.toHaveBeenCalled();
      });

      it('does not set the response status', () => {
        expect(res.status).not.toHaveBeenCalled();
      });

      it('ends the response', () => {
        expect(res.end).toHaveBeenCalledWith();
      });
    });
  });

  describe('info', () => {
    let info;

    beforeEach(() => {
      info = {api_version: '2.98.0'};
      Middlewares.new({info}).info(null, res);
    });

    it('sends info', () => {
      expect(res.send).toHaveBeenCalledWith(info);
    });
  });

  describe('listAll', () => {
    const from = 'organizations';
    let row;

    beforeEach(() => {
      row = jasmine.createSpy('row');
    });

    describe('with zero results', () => {
      beforeEach.async(async () => {
        knexHelper.tableCount.and.returnValue(Promise.resolve(0));
        await Middlewares.new({knexHelper}).listAll({params: {from}, query: {}}, res);
      });

      it('gets total results', () => {
        expect(knexHelper.tableCount).toHaveBeenCalledWith(from);
      });

      it('ends the response with an empty envelope', () => {
        expect(res.end)
          .toHaveBeenCalledWith('{"total_results":0,"total_pages":0,"prev_url":null,"next_url":null,"resources":[]}');
      });
    });

    describe('with one result', () => {
      let v2Object;

      beforeEach.async(async () => {
        v2Object = {metadata: {guid: 'some-guid'}, entity: {name: 'some-name'}};
        ServerHelper.toV2Object.and.returnValue(v2Object);
        knexHelper.tableCount.and.returnValue(Promise.resolve(1));
        knexHelper.streamPage.and.callFake(({write}) => (write(row), Promise.resolve()));
        await Middlewares.new({knexHelper}).listAll({params: {from}, query: {}}, res);
      });

      it('gets total results', () => {
        expect(knexHelper.tableCount).toHaveBeenCalledWith(from);
      });

      it('streams the page', () => {
        expect(knexHelper.streamPage).toHaveBeenCalledWith({
          from,
          page: 1,
          perPage: 100,
          orderBy: 'organizations.id',
          orderDir: 'asc',
          write: jasmine.any(Function)
        });
      });

      it('converts the row to a v2 object', () => {
        expect(ServerHelper.toV2Object).toHaveBeenCalledWith({from, row});
      });

      it('writes the header and first row', () => {
        expect(res.write)
          .toHaveBeenCalledWith('{"total_results":1,"total_pages":1,"prev_url":null,"next_url":null,"resources":['
            + JSON.stringify(v2Object));
      });

      it('ends the response with the end of the envelope', () => {
        expect(res.end).toHaveBeenCalledWith(']}');
      });
    });

    describe('with a valid page', () => {
      beforeEach.async(async () => {
        knexHelper.tableCount.and.returnValue(Promise.resolve(1));
        knexHelper.streamPage.and.returnValue(Promise.resolve());
        await Middlewares.new({knexHelper}).listAll({params: {from}, query: {page: '2'}}, res);
      });

      it('streams the page', () => {
        expect(knexHelper.streamPage).toHaveBeenCalledWith({
          from,
          page: 2,
          perPage: 100,
          orderBy: 'organizations.id',
          orderDir: 'asc',
          write: jasmine.any(Function)
        });
      });
    });

    describe('with an invalid page', () => {
      beforeEach.async(async () => {
        knexHelper.tableCount.and.returnValue(Promise.resolve(1));
        knexHelper.streamPage.and.returnValue(Promise.resolve());
        await Middlewares.new({knexHelper}).listAll({params: {from}, query: {page: '-1'}}, res);
      });

      it('streams the page', () => {
        expect(knexHelper.streamPage).toHaveBeenCalledWith({
          from,
          page: 1,
          perPage: 100,
          orderBy: 'organizations.id',
          orderDir: 'asc',
          write: jasmine.any(Function)
        });
      });
    });

    describe('with a valid perPage', () => {
      beforeEach.async(async () => {
        knexHelper.tableCount.and.returnValue(Promise.resolve(1));
        knexHelper.streamPage.and.returnValue(Promise.resolve());
        await Middlewares.new({knexHelper}).listAll({params: {from}, query: {'results-per-page': '50'}}, res);
      });

      it('streams the page', () => {
        expect(knexHelper.streamPage).toHaveBeenCalledWith({
          from,
          page: 1,
          perPage: 50,
          orderBy: 'organizations.id',
          orderDir: 'asc',
          write: jasmine.any(Function)
        });
      });
    });

    describe('with an invalid perPage', () => {
      beforeEach.async(async () => {
        knexHelper.tableCount.and.returnValue(Promise.resolve(1));
        knexHelper.streamPage.and.returnValue(Promise.resolve());
        await Middlewares.new({knexHelper}).listAll({params: {from}, query: {'results-per-page': 'invalid'}}, res);
      });

      it('streams the page', () => {
        expect(knexHelper.streamPage).toHaveBeenCalledWith({
          from,
          page: 1,
          perPage: 100,
          orderBy: 'organizations.id',
          orderDir: 'asc',
          write: jasmine.any(Function)
        });
      });
    });

    describe('with a valid orderBy', () => {
      beforeEach.async(async () => {
        knexHelper.tableCount.and.returnValue(Promise.resolve(1));
        knexHelper.streamPage.and.returnValue(Promise.resolve());
        await Middlewares.new({knexHelper}).listAll({params: {from}, query: {'order-by': 'name'}}, res);
      });

      it('streams the page', () => {
        expect(knexHelper.streamPage).toHaveBeenCalledWith({
          from,
          page: 1,
          perPage: 100,
          orderBy: 'organizations.name',
          orderDir: 'asc',
          write: jasmine.any(Function)
        });
      });
    });

    describe('with an invalid orderBy', () => {
      beforeEach.async(async () => {
        knexHelper.tableCount.and.returnValue(Promise.resolve(1));
        knexHelper.streamPage.and.returnValue(Promise.resolve());
        await Middlewares.new({knexHelper}).listAll({params: {from}, query: {'order-by': 'invalid'}}, res);
      });

      it('streams the page', () => {
        expect(knexHelper.streamPage).toHaveBeenCalledWith({
          from,
          page: 1,
          perPage: 100,
          orderBy: 'organizations.id',
          orderDir: 'asc',
          write: jasmine.any(Function)
        });
      });
    });

    describe('with a valid orderDir', () => {
      beforeEach.async(async () => {
        knexHelper.tableCount.and.returnValue(Promise.resolve(1));
        knexHelper.streamPage.and.returnValue(Promise.resolve());
        await Middlewares.new({knexHelper}).listAll({params: {from}, query: {'order-direction': 'desc'}}, res);
      });

      it('streams the page', () => {
        expect(knexHelper.streamPage).toHaveBeenCalledWith({
          from,
          page: 1,
          perPage: 100,
          orderBy: 'organizations.id',
          orderDir: 'desc',
          write: jasmine.any(Function)
        });
      });
    });

    describe('with an invalid orderDir', () => {
      beforeEach.async(async () => {
        knexHelper.tableCount.and.returnValue(Promise.resolve(1));
        knexHelper.streamPage.and.returnValue(Promise.resolve());
        await Middlewares.new({knexHelper}).listAll({params: {from}, query: {'order-direction': 'invalid'}}, res);
      });

      it('streams the page', () => {
        expect(knexHelper.streamPage).toHaveBeenCalledWith({
          from,
          page: 1,
          perPage: 100,
          orderBy: 'organizations.id',
          orderDir: 'asc',
          write: jasmine.any(Function)
        });
      });
    });

    describe('with two results', () => {
      let firstV2Obj, secondV2Obj, firstRow, secondRow;

      beforeEach.async(async () => {
        firstV2Obj = {metadata: {guid: 'guid-1'}, entity: {name: 'name-1'}};
        secondV2Obj = {metadata: {guid: 'guid-2'}, entity: {name: 'name-2'}};
        const v2Objects = [firstV2Obj, secondV2Obj];
        firstRow = jasmine.createSpy('row-1');
        secondRow = jasmine.createSpy('row-2');
        ServerHelper.toV2Object.and.returnValue(v2Objects.shift());
        knexHelper.tableCount.and.returnValue(Promise.resolve(2));
        knexHelper.streamPage.and.callFake(({write}) => (write(firstRow), write(secondRow), Promise.resolve()));
        await Middlewares.new({knexHelper}).listAll({params: {from}, query: {}}, res);
      });

      it('gets total results', () => {
        expect(knexHelper.tableCount).toHaveBeenCalledWith(from);
      });

      it('streams the page', () => {
        expect(knexHelper.streamPage).toHaveBeenCalledWith({
          from,
          page: 1,
          perPage: 100,
          orderBy: 'organizations.id',
          orderDir: 'asc',
          write: jasmine.any(Function)
        });
      });

      it('converts the row to a v2 object', () => {
        expect(ServerHelper.toV2Object).toHaveBeenCalledWith({from, row: firstRow});
        expect(ServerHelper.toV2Object).toHaveBeenCalledWith({from, row: secondRow});
      });

      it('writes the header and first row', () => {
        expect(res.write).toHaveBeenCalledWith(`{"total_results":2,"total_pages":1,"prev_url":null,"next_url":null,"resources":[${JSON.stringify(firstV2Obj)}`);
      });

      it('writes a comma and second row', () => {
        expect(res.write).toHaveBeenCalledWith(`,${JSON.stringify(firstV2Obj)}`);
      });

      it('ends the response with the end of the envelope', () => {
        expect(res.end).toHaveBeenCalledWith(']}');
      });
    });
  });

  describe('requireMetadata', () => {
    describe('without metadata', () => {
      beforeEach(() => {
        Middlewares.new({}).requireMetadata({params: {}}, null, next);
      });

      it('calls the next route', () => {
        expect(next).toHaveBeenCalledWith('route');
      });
    });

    describe('with metadata', () => {
      beforeEach(() => {
        Middlewares.new({}).requireMetadata({params: {from: 'organizations'}}, null, next);
      });

      it('calls the next metadata', () => {
        expect(next).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('setJsonContenType', () => {
    beforeEach(() => {
      Middlewares.new({}).setJsonContentType(null, res, next);
    });

    it('sets the response content type', () => {
      expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/json');
    });

    it('calls the next middleware', () => {
      expect(next).toHaveBeenCalledWith();
    });
  });
});