const Server = require('./server');
const MySqlDriver = require('./mysql_driver');

const serverInfo = {
  api_version: '2.98.0',
  authorization_endpoint: process.env.AUTHORIZATION_ENDPOINT
};
const mysqlConfig = {
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE
};

Server.new(MySqlDriver.new(mysqlConfig), serverInfo).listen(process.env.PORT);