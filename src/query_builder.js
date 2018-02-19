const mysql = require('mysql');

const leftJoinSql = ({from, foreignTable, fromKey, foreignKey}) =>
  mysql.format('LEFT JOIN ?? ON ??.?? = ??.??', [foreignTable, from, fromKey, foreignTable, foreignKey]);
const limitSql = limit => mysql.format('LIMIT ?', limit);
const offsetSql = offset => mysql.format('OFFSET ?', offset);
const orderByDirSql = dir => dir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
const orderBySql = ([col, dir = '']) => mysql.format(`ORDER BY ?? ${orderByDirSql(dir)}`, col);
const whereSql = ([col, op, val]) => mysql.format(`WHERE ?? ${op} ?`, [col, val]);

const count = from => [
  mysql.format('SELECT COUNT(??) AS count', 'id'),
  mysql.format('FROM ??', from)
].filter(Boolean).join(' ');

const select = (columns, state = {leftJoins: []}) => ({
  build: () => {
    const {from, leftJoins, limit, offset, orderBy, where} = state;
    return [
      mysql.format(`SELECT ${columns && columns.length > 0 ? columns.map(() => '??').join(',') : '*'}`, columns),
      mysql.format('FROM ??', from),
      leftJoins.reduce((memo, join, i) => `${memo}${i > 0 ? ' ' : ''}${leftJoinSql({from, ...join})}`, ''),
      where && whereSql(where),
      orderBy && orderBy[0] && orderBySql(orderBy),
      limit && limitSql(limit),
      offset && offsetSql(offset)
    ].filter(Boolean).join(' ');
  },
  from: from => select(columns, {...state, from}),
  leftJoins: joins => select(columns, ({...state, leftJoins: [...state.leftJoins, ...joins]})),
  limit: limit => select(columns, {...state, limit}),
  offset: offset => select(columns, {...state, offset}),
  orderBy: (...args) => select(columns, {...state, orderBy: args}),
  where: (...where) => select(columns, {...state, where})
});

module.exports = {count, select};