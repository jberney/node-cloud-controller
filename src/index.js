const sqlDriver = require('./mysql_driver').new({
  entities: require('./entities'),
  config: {
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE
  }
});
const server = require('./server').new({
  express: require('express'),
  sqlDriver,
  info: {
    api_version: '2.98.0',
    authorization_endpoint: process.env.AUTHORIZATION_ENDPOINT
  }
});

server.listen(process.env.PORT);