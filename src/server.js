const express = require('express');
const {boolean, subObjectUrls} = require('./server_helper');

module.exports = ({
  new({writeList}, info) {
    const app = express();

    app.get('/v2/info', (req, res) => res.send(info));

    app.get('/v2/organizations', writeList({
      from: 'organizations',
      leftJoins: [{foreignTable: 'quota_definitions', fromKey: 'quota_definition_id', foreignKey: 'id'}],
      entity: {
        name: {},
        billing_enabled: {type: boolean},
        quota_definition_guid: {foreignTable: 'quota_definitions', column: 'guid'},
        status: {},
        quota_definition_url: {
          foreignTable: 'quota_definitions', column: 'guid', format: '/v2/quota_definitions/%s'
        },
        ...subObjectUrls({
          from: 'organizations',
          foreignTables: ['spaces', 'domains', 'private_domains', 'users', 'managers', 'billing_managers', 'auditors',
            'app_events', 'space_quota_definitions']
        })
      }
    }));

    return app;
  }
});