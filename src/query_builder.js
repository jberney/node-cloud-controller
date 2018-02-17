const mysql = require('mysql');

const leftJoin = ({from, foreignTable, fromKey, foreignKey}) =>
  mysql.format('LEFT JOIN ?? ON ??.?? = ??.??', [foreignTable, from, fromKey, foreignTable, foreignKey]);

const select = (state = {leftJoins: []}) => ({
  build: () => {
    const {from, leftJoins} = state;
    return [
      mysql.format('SELECT * FROM ??', [from]),
      leftJoins.reduce((memo, join) => `${memo} ${leftJoin({from, ...join})}`, '')
    ].join('');
  },
  from: from => select({...state, from}),
  leftJoins: joins => select(({...state, leftJoins: [...state.leftJoins, ...joins]}))
});

module.exports = {select};