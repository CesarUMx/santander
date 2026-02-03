const app = require('./app');
const { config, validateConfig } = require('./src/config');

validateConfig();

const server = app.listen(config.port, () => {
    console.log('================================');
    console.log('Servidor iniciado');
    console.log('================================');
    console.log(`Server running on port ${config.port}`);
    console.log(`URL: http://localhost:${config.port}`);
    console.log('================================');
});

// Manejo de cierre
process.on('SIGTERM', () => {
  console.log('Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nCerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});