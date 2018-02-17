const mysql = require('mysql');

const QueryBuilder = {
  select: () => Select()
};

const leftJoin = ({from, foreignTable, fromKey, foreignKey}) =>
  mysql.format('LEFT JOIN ?? ON ??.?? = ??.??', [foreignTable, from, fromKey, foreignTable, foreignKey]);

const Select = (state = {leftJoins: []}) => ({
  build: () => {
    const {from, leftJoins = []} = state;
    return [
      mysql.format('SELECT * FROM ??', [from]),
      leftJoins.reduce((memo, join) => `${memo} ${leftJoin({from, ...join})}`, '')
    ].join('');
  },
  from: from => Select({...state, from}),
  leftJoins: joins => Select(({...state, leftJoins: [...state.leftJoins, ...joins]}))
});

module.exports = QueryBuilder;