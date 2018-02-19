const metadata = require('./metadata');

const boolean = ({from, column, row}) => !!row[`${from}.${column}`];
const raw = ({from, column, row}) => row[`${from}.${column}`];
const types = {boolean, raw};

const newMetadata = ({row, from}) => ({
  guid: row[`${from}.guid`],
  url: `/v2/${from}/${row[`${from}.guid`]}`,
  created_at: row[`${from}.created_at`],
  updated_at: row[`${from}.updated_at`]
});

const newEntity = ({from, row}) => {
  const entity = {};
  Object.entries(metadata[from].entity).forEach(([key, {foreignTable, column, type = 'raw', format}]) => {
    const value = types[type]({from: foreignTable || from, column: column || key, row});
    entity[key] = format ? format.replace('%s', value) : value;
  });
  return entity;
};

const toV2Object = args => ({metadata: newMetadata(args), entity: newEntity(args)});

module.exports = {toV2Object};