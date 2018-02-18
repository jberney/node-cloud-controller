const Server = ({
  new: ({express, middlewares}) => express()
    .get('/v2/info', middlewares.info)
    .get('/v2/:from', middlewares.requireMetadata, middlewares.listAll)
});

module.exports = Server;