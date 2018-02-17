const boolean = ({from, column}) => row => !!row[from][column];
const raw = ({from, column}) => row => row[from][column];

const subObjectUrls = ({from, foreignTables}) => {
  const obj = {};
  foreignTables.forEach(foreignTable => obj[`${foreignTable}_url`] = {value: row => `/v2/${from}/${row[from].guid}/${foreignTable}`});
  return obj;
};

const newMetadata = ({guid, from, created_at, updated_at}) => ({
  guid,
  url: `/v2/${from}/${guid}`,
  created_at,
  updated_at
});

const newEntity = ({entity, from, row}) => {
  const obj = {};
  Object.entries(entity)
    .map(([key, {table, column, value, type = raw}]) =>
      [key, value || type({from: table || from, column: column || key})])
    .forEach(([key, value]) => obj[key] = value(row));
  return obj;
};

const writeRow = ({prefix = '', row, from, entity}) => write => write(`${prefix}${JSON.stringify({
  metadata: newMetadata({...row[from], from}),
  entity: newEntity({entity, from, row})
})}`);

module.exports = {boolean, subObjectUrls, writeRow};