const express = require('express');
const KnexHelper = require('./knex_helper');
const Middlewares = require('./middlewares');
const Server = require('./server');

const knex = KnexHelper.knex({
  client: 'mysql2',
  connection: {
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE
  }
});
const knexHelper = KnexHelper.new(knex);
const middlewares = Middlewares.new({
  info: {
    api_version: '2.98.0',
    authorization_endpoint: process.env.AUTHORIZATION_ENDPOINT
  },
  knexHelper
});
const server = Server.new({express, middlewares});

server.listen(process.env.PORT);