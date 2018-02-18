const express = require('express');
const mysql = require('mysql');
const Middlewares = require('./middlewares');
const MySqlDriver = require('./mysql_driver');
const Server = require('./server');

const pool = mysql.createPool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE
});
const middlewares = Middlewares.new({
  info: {
    api_version: '2.98.0',
    authorization_endpoint: process.env.AUTHORIZATION_ENDPOINT
  },
  pool,
  SqlDriver: MySqlDriver
});
const server = Server.new({express, middlewares});

server.listen(process.env.PORT);