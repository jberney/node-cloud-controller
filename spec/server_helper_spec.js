require('./spec_helper');

describe('ServerHelper', () => {
  const from = 'organizations';
  let ServerHelper;

  beforeEach(() => {
    ServerHelper = require('../src/server_helper');
  });

  describe('toV2Object', () => {
    let row;

    beforeEach(() => {
      row = {
        ['organizations.guid']: 'organization-guid',
        ['organizations.created_at']: 'long ago',
        ['organizations.updated_at']: 'recently',
        ['organizations.name']: 'some-org-name',
        ['organizations.billing_enabled']: 1,
        ['organizations.quota_definition_guid']: 'some-quota-def-guid',
        ['organizations.status']: 'active',
        ['quota_definitions.guid']: 'some-quota-def-guid'
      };
    });

    it('returns v2 object', () => {
      expect(ServerHelper.toV2Object({row, from})).toEqual({
        metadata: {
          guid: row['organizations.guid'],
          url: `/v2/organizations/${row['organizations.guid']}`,
          created_at: row['organizations.created_at'],
          updated_at: row['organizations.updated_at']
        },
        entity: {
          name: row['organizations.name'],
          billing_enabled: !!row['organizations.billing_enabled'],
          quota_definition_guid: row['quota_definitions.guid'],
          status: row['organizations.status'],
          quota_definition_url: `/v2/quota_definitions/${row['quota_definitions.guid']}`,
          spaces_url: '/v2/organizations/organization-guid/spaces',
          domains_url: '/v2/organizations/organization-guid/domains',
          private_domains_url: '/v2/organizations/organization-guid/private_domains',
          users_url: '/v2/organizations/organization-guid/users',
          managers_url: '/v2/organizations/organization-guid/managers',
          billing_managers_url: '/v2/organizations/organization-guid/billing_managers',
          auditors_url: '/v2/organizations/organization-guid/auditors',
          app_events_url: '/v2/organizations/organization-guid/app_events',
          space_quota_definitions_url: '/v2/organizations/organization-guid/space_quota_definitions'
        }
      });
    });
  });
});