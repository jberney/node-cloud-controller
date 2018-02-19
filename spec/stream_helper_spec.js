describe('StreamHelper', () => {
  let StreamHelper, Transform;

  beforeEach(() => {
    StreamHelper = require('../src/stream_helper');
    ({Transform} = require('stream'));
  });

  describe('newWritableStream', () => {
    let write, writableStream;

    beforeEach.async(async () => {
      write = jasmine.createSpy('write');
      writableStream = StreamHelper.newWritableStream(write);
      const readableStream = new Transform({readableObjectMode: true});
      readableStream.pipe(writableStream);
      readableStream.push('some-chunk');
      let resolve;
      const promise = new Promise(res => resolve = res);
      readableStream.on('end', () => resolve());
      readableStream.push(null);
      await promise;
    });

    it('writes the chunk', () => {
      expect(write).toHaveBeenCalledWith('some-chunk');
    });
  });
});