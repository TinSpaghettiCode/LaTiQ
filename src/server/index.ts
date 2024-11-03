import { MediaSoupServer } from "@/server/services/mediasoup/mediasoup.server.js"; 
import { MediaSoupSocketServer } from "@/server/services/mediasoup/mediasoup.socket.server.js";

const startServer = async () => {
  try {
    // Khởi tạo MediaSoup Server
    const mediaSoupServer = new MediaSoupServer({
      worker: {
        logLevel: 'debug',
        rtcMinPort: 40000,
        rtcMaxPort: 49999,
      }
    });
    await mediaSoupServer.init();

    // Khởi tạo WebSocket Server
    const socketServer = new MediaSoupSocketServer(3000);
    console.log('MediaSoup Server started on port 3000');

    // Xử lý cleanup khi server shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      await mediaSoupServer.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();