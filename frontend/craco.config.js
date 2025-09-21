module.exports = {
  eslint: {
    enable: false,
  },
  devServer: {
    allowedHosts: 'all',
    client: {
      overlay: false,
    },
    // Блокируем нежелательные домены
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.use((req, res, next) => {
        if (req.url.includes('autotrack.studyquicks.com')) {
          console.warn('Блокирован запрос к autotrack.studyquicks.com');
          return res.status(403).send('Запрос заблокирован');
        }
        next();
      });
      return middlewares;
    },
  },
};
