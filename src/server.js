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
        name: {table: 'organizations'},
        billing_enabled: {table: 'organizations', type: boolean},
        quota_definition_guid: {column: 'guid', table: 'quota_definitions'},
        status: {table: 'organizations'},
        quota_definition_url: {value: ({quota_definitions: {guid}}) => `/v2/quota_definitions/${guid}`},
        ...subObjectUrls({
          table: 'organizations',
          foreignTables: ['spaces', 'domains', 'private_domains', 'users', 'managers', 'billing_managers', 'auditors',
            'app_events', 'space_quota_definitions']
        })
      }
    }));

    app.get('/v2/organizations/:guid/spaces', writeList({
      from: 'spaces',
      entity: {
        name: {table: 'spaces'}
      }
    }));

    return app;
  }
});