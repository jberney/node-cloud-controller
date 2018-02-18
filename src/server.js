const Server = ({
  new({express, sqlDriver: {writeList}, info}) {
    const app = express();

    app.get('/v2/info', (req, res) => res.send(info));
    app.get('/v2/:type', writeList);

    return app;
  }
});

module.exports = Server;