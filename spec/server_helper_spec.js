describe('ServerHelper', () => {
  const from = 'organizations';
  let ServerHelper;

  beforeEach(() => {
    ServerHelper = require('../src/server_helper');
  });

  describe('boolean', () => {
    const column = 'some-column';

    describe('when zero', () => {
      it('returns false', () => {
        expect(ServerHelper.boolean({from, column, row: {[from]: {[column]: 0}}})).toBe(false);
      });
    });

    describe('when one', () => {
      it('returns false', () => {
        expect(ServerHelper.boolean({from, column, row: {[from]: {[column]: 1}}})).toBe(true);
      });
    });
  });

  describe('subObjectUrls', () => {
    let returned;

    beforeEach(() => {
      returned = ServerHelper.subObjectUrls({from, foreignTables: ['foreign_table_1', 'foreign_table_2']});
    });

    it('returns object mapping foreign table url keys to url-generating functions', () => {
      expect(returned).toEqual({
        foreign_table_1_url: {column: 'guid', format: `/v2/${from}/%s/foreign_table_1`},
        foreign_table_2_url: {column: 'guid', format: `/v2/${from}/%s/foreign_table_2`}
      });
    });
  });

  describe('writeRow', () => {
    let entity, row, write;

    beforeEach(() => {
      entity = {
        name: {},
        billing_enabled: {type: ServerHelper.boolean},
        quota_definition_guid: {foreignTable: 'quota_definitions', column: 'guid'},
        status: {},
        quota_definition_url: {
          foreignTable: 'quota_definitions',
          column: 'guid',
          format: '/v2/quota_definitions/%s'
        }
      };
      row = {
        organizations: {
          guid: 'organization-guid',
          created_at: 'long ago',
          updated_at: 'recently',
          name: 'some-org-name',
          billing_enabled: 1,
          quota_definition_guid: 'some-quota-def-guid',
          status: 'active'
        },
        quota_definitions: {guid: 'some-quota-def-guid'}
      };
      write = jasmine.createSpy('write');
    });

    describe('without prefix', () => {
      beforeEach(() => {
        ServerHelper.writeRow({entity, row, from})(write);
      });

      it('writes row', () => {
        expect(write).toHaveBeenCalledWith(JSON.stringify({
          metadata: {
            guid: row.organizations.guid,
            url: `/v2/organizations/${row.organizations.guid}`,
            created_at: row.organizations.created_at,
            updated_at: row.organizations.updated_at
          },
          entity: {
            name: row.organizations.name,
            billing_enabled: !!row.organizations.billing_enabled,
            quota_definition_guid: row.quota_definitions.guid,
            status: row.organizations.status,
            quota_definition_url: `/v2/quota_definitions/${row.quota_definitions.guid}`
          }
        }));
      });
    });

    describe('with prefix', () => {
      beforeEach(() => {
        ServerHelper.writeRow({entity, row, from, prefix: ','})(write);
      });

      it('writes prefix and row', () => {
        expect(write).toHaveBeenCalledWith(`,${JSON.stringify({
          metadata: {
            guid: row.organizations.guid,
            url: `/v2/organizations/${row.organizations.guid}`,
            created_at: row.organizations.created_at,
            updated_at: row.organizations.updated_at
          },
          entity: {
            name: row.organizations.name,
            billing_enabled: !!row.organizations.billing_enabled,
            quota_definition_guid: row.quota_definitions.guid,
            status: row.organizations.status,
            quota_definition_url: `/v2/quota_definitions/${row.quota_definitions.guid}`
          }
        })}`);
      });
    });
  });
});