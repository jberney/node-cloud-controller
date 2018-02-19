const Server = ({
  new: ({express, middlewares}) => express()
    .get('/v2/info', middlewares.setJsonContentType, middlewares.info)
    .get('/v2/:from', middlewares.requireMetadata, middlewares.setJsonContentType, middlewares.handleError(middlewares.listAll))
});

module.exports = Server;