const cds = require('@sap/cds');

const LOG = cds.log('server');

async function startServer() {
  try {
    LOG.info('Starting CAP server...');
    
    const server = await cds.serve('all').from('srv').at(process.env.PORT || 4004);
    
    server.on('listening', () => {
      const { url } = server;
      LOG.info(`CAP server is running at: ${url}`);
      LOG.info(`API endpoints available at: ${url}/bookshop`);
      
      console.log('\n🚀 Available endpoints:');
      console.log(`📚 Books: GET ${url}/bookshop/Books`);
      console.log(`🔧 Create Book: POST ${url}/bookshop/createBook`);
      console.log(`📖 Metadata: GET ${url}/bookshop/$metadata`);
    });
    
    process.on('SIGINT', async () => {
      LOG.info('Received SIGINT, shutting down gracefully...');
      await server.close();
      process.exit(0);
    });
    
    return server;
    
  } catch (error) {
    LOG.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };