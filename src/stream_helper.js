const {Transform} = require('stream');

module.exports = {
  newWritableStream: write => new Transform({
    transform: (chunk, enc, next) => (write(chunk), next()),
    writableObjectMode: true
  })
};