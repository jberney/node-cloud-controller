const Server = ({
  new: ({express, middlewares}) => express()
    .get('/v2/info', middlewares.info)
    .get('/v2/:type', middlewares.listAll)
});

module.exports = Server;