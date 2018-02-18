const subObjectUrls = ({from, foreignTables}) => {
  const obj = {};
  foreignTables.forEach(foreignTable => obj[`${foreignTable}_url`] = {
    column: 'guid',
    format: `/v2/${from}/%s/${foreignTable}`
  });
  return obj;
};

module.exports = {
  organizations: {
    entity: {
      name: {},
      billing_enabled: {type: 'boolean'},
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
    },
    orderBys: ['id', 'name']
  }
};