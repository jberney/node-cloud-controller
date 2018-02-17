const boolean = ({from, column, row}) => !!row[from][column];
const raw = ({from, column, row}) => row[from][column];
const types = {boolean, raw};

const subObjectUrls = ({from, foreignTables}) => {
  const obj = {};
  foreignTables.forEach(foreignTable => obj[`${foreignTable}_url`] = {
    column: 'guid',
    format: `/v2/${from}/%s/${foreignTable}`
  });
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
  Object.entries(entity).forEach(([key, {foreignTable, column, type = 'raw', format}]) => {
    const value = types[type]({from: foreignTable || from, column: column || key, row});
    obj[key] = format ? format.replace('%s', value) : value;
  });
  return obj;
};

const writeRow = ({prefix = '', row, from, entity}) => write => write(`${prefix}${JSON.stringify({
  metadata: newMetadata({...row[from], from}),
  entity: newEntity({entity, from, row})
})}`);

module.exports = {subObjectUrls, writeRow};