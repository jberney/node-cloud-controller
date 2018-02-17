const boolean = ({table, column}) => row => !!row[table][column];
const raw = ({table, column}) => row => row[table][column];

const metadata = ({table, guid, created_at, updated_at}) => ({
  guid,
  url: `/v2/${table}/${guid}`,
  created_at,
  updated_at
});

const subObjectUrls = ({table, foreignTables}) => {
  const obj = {};
  foreignTables.forEach(foreignTable => obj[`${foreignTable}_url`] = {value: row => `/v2/${table}/${row[table].guid}/${foreignTable}`});
  return obj;
};

const entityEntries = entity => Object.entries(entity)
  .map(([key, {table, column, value, type = raw}]) => [key, value || type({table, column: column || key})]);

const writeRow = ({entity: e, row, prefix = '', table}) => write => {
  const entity = {};
  entityEntries(e).forEach(([key, value]) => entity[key] = value(row));
  write(`${prefix}${JSON.stringify({metadata: metadata({table, ...row[table]}), entity})}`);
};

module.exports = {boolean, metadata, subObjectUrls, writeRow};