import { WebSocketServer } from 'ws';
import { EventEmitter } from '../../../shared/types/EventEmitter.js';
import type { WebSocket } from 'ws';
import type { WebSocketMessage } from '../../../shared/types/types.js';

export class MediaSoupSocketServer extends EventEmitter {
  private wss: WebSocketServer;
  private mediaSoupServer: any; 

  constructor(port: number) {
    super();
    this.wss = new WebSocketServer({ port });
    this.setupSocketServer();
  }

  private setupSocketServer(): void {
    this.wss.on('connection', (socket: WebSocket) => {
      // Gửi router capabilities khi client kết nối
      const message: WebSocketMessage = {
        type: 'routerRtpCapabilities',
        data: this.mediaSoupServer.routerCapabilities
      };
      socket.send(JSON.stringify(message));

      // Xử lý các messages từ client
      socket.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          // Xử lý message ở đây
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      socket.on('close', () => {
        console.log('Client disconnected');
      });

      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  public close(): void {
    this.wss.close();
  }
}