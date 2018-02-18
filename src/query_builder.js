const mysql = require('mysql');

const leftJoinSql = ({from, foreignTable, fromKey, foreignKey}) =>
  mysql.format('LEFT JOIN ?? ON ??.?? = ??.??', [foreignTable, from, fromKey, foreignTable, foreignKey]);
const orderByDirSql = dir => dir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
const orderBySql = ([col, dir = '']) => mysql.format(`ORDER BY ?? ${orderByDirSql(dir)}`, [col]);

const select = (state = {leftJoins: []}) => ({
  build: () => {
    const {from, leftJoins, orderBy} = state;
    const sql = [
      mysql.format('SELECT * FROM ??', [from]),
      leftJoins.reduce((memo, join, i) => `${memo}${i > 0 ? ' ' : ''}${leftJoinSql({from, ...join})}`, ''),
      orderBy && orderBy[0] && orderBySql(orderBy)
    ].filter(Boolean).join(' ');
    return sql;
  },
  from: from => select({...state, from}),
  leftJoins: joins => select(({...state, leftJoins: [...state.leftJoins, ...joins]})),
  orderBy: (...args) => select({...state, orderBy: args})
});

module.exports = {select};