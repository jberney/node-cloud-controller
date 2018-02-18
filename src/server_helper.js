const entities = require('./entities');

const boolean = ({from, column, row}) => !!row[from][column];
const raw = ({from, column, row}) => row[from][column];
const types = {boolean, raw};

const newMetadata = ({guid, from, created_at, updated_at}) => ({
  guid,
  url: `/v2/${from}/${guid}`,
  created_at,
  updated_at
});

const newEntity = ({from, row}) => {
  const entity = {};
  Object.entries(entities[from]).forEach(([key, {foreignTable, column, type = 'raw', format}]) => {
    const value = types[type]({from: foreignTable || from, column: column || key, row});
    entity[key] = format ? format.replace('%s', value) : value;
  });
  return entity;
};

const writeRow = ({prefix = '', row, from}) => write => write(`${prefix}${JSON.stringify({
  metadata: newMetadata({...row[from], from}),
  entity: newEntity({from, row})
})}`);

module.exports = {writeRow};