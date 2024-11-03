import { EventEmitter } from '../../shared/types/EventEmitter';
import { mediaSoupClient } from './mediasoup.client';

interface WebSocketMessage {
  type: string;
  data: any;
}

/**
 * MediaSoupSocket - Quản lý kết nối WebSocket giữa client và server
 */
export class MediaSoupSocket extends EventEmitter {
  private socket: WebSocket | null = null;
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_INTERVAL = 3000; // 3 seconds

  constructor(private url: string = 'ws://localhost:3001/ws') {
    super();
  }

  /**
   * Kết nối tới WebSocket server
   */
  public async connect(): Promise<void> {
    try {
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);

      // Thiết lập các event listeners cho MediaSoup client
      this.setupMediaSoupListeners();
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      throw error;
    }
  }

  /**
   * Thiết lập các event listeners cho MediaSoup client
   */
  private setupMediaSoupListeners(): void {
    mediaSoupClient.on('connectProducerTransport', async ({ dtlsParameters, callback, errback }) => {
      try {
        await this.send('connectProducerTransport', { dtlsParameters });
        callback();
      } catch (error) {
        errback(error instanceof Error ? error : new Error('Failed to connect producer transport'));
      }
    });

    mediaSoupClient.on('connectConsumerTransport', async ({ dtlsParameters, callback, errback }) => {
      try {
        await this.send('connectConsumerTransport', { dtlsParameters });
        callback();
      } catch (error) {
        errback(error instanceof Error ? error : new Error('Failed to connect consumer transport'));
      }
    });

    mediaSoupClient.on('produce', async ({ parameters, callback, errback }) => {
      try {
        const { id } = await this.send('produce', parameters);
        callback({ id });
      } catch (error) {
        errback(error instanceof Error ? error : new Error('Failed to produce'));
      }
    });
  }

  /**
   * Gửi tin nhắn tới server
   */
  public async send(type: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const message: WebSocketMessage = {
        type,
        data
      };

      // Tạo một ID duy nhất cho request
      const requestId = Math.random().toString(36).substring(2, 15);
      
      // Timeout cho response
      const timeout = setTimeout(() => {
        this.removeListener(`response:${requestId}`, responseHandler);
        reject(new Error('Request timeout'));
      }, 10000);

      // Handler cho response
      const responseHandler = (response: any) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data);
        }
      };

      // Lắng nghe response
      this.once(`response:${requestId}`, responseHandler);

      // Gửi message với requestId
      this.socket.send(JSON.stringify({ ...message, requestId }));
    });
  }

  /**
   * Xử lý khi WebSocket được mở
   */
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.connected = true;
    this.reconnectAttempts = 0;
    this.emit('connected');
  }

  /**
   * Xử lý khi WebSocket bị đóng
   */
  private handleClose(): void {
    console.log('WebSocket closed');
    this.connected = false;
    this.emit('disconnected');

    // Thử kết nối lại
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.RECONNECT_INTERVAL);
    }
  }

  /**
   * Xử lý khi có lỗi WebSocket
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.emit('error', error);
  }

  /**
   * Xử lý tin nhắn từ server
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage & { requestId?: string };
      
      if (message.requestId) {
        // Nếu có requestId, đây là response cho một request
        this.emit(`response:${message.requestId}`, message.data);
      } else {
        // Xử lý các loại tin nhắn khác nhau
        switch (message.type) {
          case 'newProducer':
            this.handleNewProducer(message.data);
            break;
          case 'producerClosed':
            this.handleProducerClosed(message.data);
            break;
          // Thêm các case khác khi cần
          default:
            console.warn('Unknown message type:', message.type);
        }
      }
    } catch (error) {
      console.error('Failed to handle WebSocket message:', error);
    }
  }

  /**
   * Xử lý khi có producer mới
   */
    private async handleNewProducer(data: { producerId: string }): Promise<void> {
    try {
      // Tạo consumer cho producer mới
      if (mediaSoupClient.canConsume()) {
        const rtpCapabilities = mediaSoupClient.deviceRtpCapabilities;
        if (rtpCapabilities) {
          const consumerData = await this.send('consume', {
            producerId: data.producerId,
            rtpCapabilities
          });

          // Thêm consumer mới vào client
          const consumer = await mediaSoupClient.consume(consumerData);
          mediaSoupClient.addConsumer(consumer);
        }
      }
    } catch (error) {
      console.error('Failed to handle new producer:', error);
    }
  }

  /**
   * Xử lý khi producer bị đóng
   */
  private handleProducerClosed(data: { producerId: string }): void {
    // Cleanup logic khi producer bị đóng
    mediaSoupClient.closeConsumerByProducerId(data.producerId);
  }

  /**
   * Đóng kết nối WebSocket
   */
  public close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
  }
}

// Export singleton instance
export const mediaSoupSocket = new MediaSoupSocket('ws://localhost:3000');
