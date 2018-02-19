const mysql = require('mysql');

const leftJoinSql = ({from, foreignTable, fromKey, foreignKey}) =>
  mysql.format('LEFT JOIN ?? ON ??.?? = ??.??', [foreignTable, from, fromKey, foreignTable, foreignKey]);
const limitSql = limit => mysql.format('LIMIT ?', [limit]);
const orderByDirSql = dir => dir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
const orderBySql = ([col, dir = '']) => mysql.format(`ORDER BY ?? ${orderByDirSql(dir)}`, [col]);

const select = (columns, state = {leftJoins: []}) => ({
  build: () => {
    const {from, leftJoins, limit, orderBy} = state;
    return [
      mysql.format(`SELECT ${columns && columns.length > 0 ? columns.map(() => '??').join(',') : '*'}`, columns),
      mysql.format('FROM ??', [from]),
      leftJoins.reduce((memo, join, i) => `${memo}${i > 0 ? ' ' : ''}${leftJoinSql({from, ...join})}`, ''),
      orderBy && orderBy[0] && orderBySql(orderBy),
      limit && limitSql(limit)
    ].filter(Boolean).join(' ');
  },
  from: from => select(columns, {...state, from}),
  leftJoins: joins => select(columns, ({...state, leftJoins: [...state.leftJoins, ...joins]})),
  limit: limit => select(columns, {...state, limit}),
  orderBy: (...args) => select(columns, {...state, orderBy: args})
});

module.exports = {select};