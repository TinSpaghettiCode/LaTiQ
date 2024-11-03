import * as mediasoupClient from "mediasoup-client";
import { EventEmitter } from "../../shared/types/EventEmitter";

interface MediaSoupClientOptions {
    /**
     * Tự động đóng các kết nối khi component unmount
     */
    autoClose?: boolean;
    /**
     * Thời gian timeout cho các operations (ms)
     */
    timeout?: number;
    /**
     * Cấu hình mặc định cho producers
     */
    producerOptions?: {
      initialBitrate?: number;
      maxBitrate?: number;
      codecOptions?: {
        videoGoogleStartBitrate?: number;
      };
    };
  }

/**
 * MediaSoupClient - Quản lý phía client của WebRTC và media streaming
 */
export class MediaSoupClient extends EventEmitter {
  private device: mediasoupClient.Device | null = null;
  private producerTransport: mediasoupClient.types.Transport | null = null;
  private consumerTransport: mediasoupClient.types.Transport | null = null;
  private producers: Map<string, mediasoupClient.types.Producer> = new Map();
  private consumers: Map<string, mediasoupClient.types.Consumer> = new Map();

  constructor(private options: MediaSoupClientOptions = {}) {
    super();
    // Set default values
    this.options = {
      autoClose: true,
      timeout: 10000,
      ...options
    };
  }

  /**
   * Khởi tạo device
   * @param routerRtpCapabilities Khả năng RTP của router
   */
  public async loadDevice(routerRtpCapabilities: any): Promise<void> {
    try {
      this.device = new mediasoupClient.Device();
      await this.device.load({ routerRtpCapabilities });
    } catch (error) {
      console.error("Failed to load device:", error);
      throw error;
    }
  }

  /**
   * Tạo transport cho producer
   * @param params Thông số transport từ server
   */
  public async createProducerTransport(params: any): Promise<void> {
    if (!this.device) {
      throw new Error("Device not loaded");
    }

    this.producerTransport = this.device.createSendTransport(params);

    this.producerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
      try {
        // Implement: Send dtlsParameters to server
        this.emit("connectProducerTransport", {
          dtlsParameters,
          callback,
          errback,
        });
      } catch (error) {
        errback(error as Error);
      }
    });

    this.producerTransport.on("produce", async (parameters, callback, errback) => {
      try {
        // Implement: Send produce parameters to server
        this.emit("produce", {
          parameters,
          callback,
          errback,
        });
      } catch (error) {
        errback(error as Error);
      }
    });
  }

  /**
   * Tạo transport cho consumer
   * @param params Thông số transport từ server
   */
  public async createConsumerTransport(params: any): Promise<void> {
    if (!this.device) {
      throw new Error("Device not loaded");
    }

    this.consumerTransport = this.device.createRecvTransport(params);

    this.consumerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
      try {
        // Implement: Send dtlsParameters to server
        this.emit("connectConsumerTransport", {
          dtlsParameters,
          callback,
          errback,
        });
      } catch (error) {
        errback(error as Error);
      }
    });
  }

  /**
   * Produce media
   * @param track MediaStreamTrack để produce
   */
  public async produce(track: MediaStreamTrack): Promise<mediasoupClient.types.Producer> {
    if (!this.producerTransport) {
      throw new Error("Producer transport not created");
    }

    const producer = await this.producerTransport.produce({
        track,
        ...this.options.producerOptions
      });
    this.producers.set(producer.id, producer);
    return producer;
  }

  /**
   * Consume media
   * @param params Thông số consumer từ server
   */
  public async consume(params: {
    id: string;
    producerId: string;
    kind: string;
    rtpParameters: any;
  }): Promise<mediasoupClient.types.Consumer> {
    if (!this.consumerTransport) {
      throw new Error("Consumer transport not created");
    }

    const consumer = await this.consumerTransport.consume(params as mediasoupClient.types.ConsumerOptions<mediasoupClient.types.AppData>);
    this.consumers.set(consumer.id, consumer);
    return consumer;
  }

  /**
   * Kiểm tra khả năng consume một producer cụ thể
   * @param producerId ID của producer cần consume
   * @param rtpCapabilities RTP capabilities của device
   * @returns boolean Có thể consume hay không
   */
  /**
   * Kiểm tra khả năng consume của device
   * @returns boolean Có thể consume hay không
   */
  public canConsume(): boolean {
    if (!this.device) {
      console.warn('Device not initialized');
      return false;
    }

    try {
      // Kiểm tra device đã được load
      if (!this.device.loaded) {
        console.warn('Device not loaded');
        return false;
      }

      // Kiểm tra khả năng nhận video
      if (!this.device.canProduce('video')) {
        console.warn('Device cannot produce video');
        return false;
      }

      // Kiểm tra RTP capabilities
      if (!this.device.rtpCapabilities) {
        console.warn('Device has no RTP capabilities');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking consume capability:', error);
      return false;
    }
  }

  /**
   * Getter cho device capabilities
   */
  public get deviceRtpCapabilities(): mediasoupClient.types.RtpCapabilities | undefined {
    return this.device?.rtpCapabilities;
  }

  /**
   * Getter cho device loaded state
   */
  public get isDeviceLoaded(): boolean {
    return this.device?.loaded ?? false;
  }

  /**
   * Đóng client và giải phóng tài nguyên
   */
  public close(): void {
    this.producers.forEach((producer) => producer.close());
    this.consumers.forEach((consumer) => consumer.close());

    if (this.producerTransport) {
      this.producerTransport.close();
    }
    if (this.consumerTransport) {
      this.consumerTransport.close();
    }

    this.producers.clear();
    this.consumers.clear();
    this.producerTransport = null;
    this.consumerTransport = null;
    this.device = null;
  }

  /**
   * Lấy consumer theo ID
   */
  public getConsumer(consumerId: string): mediasoupClient.types.Consumer | undefined {
    return this.consumers.get(consumerId);
  }

  /**
   * Lấy consumer theo producer ID
   */
  public getConsumerByProducerId(producerId: string): mediasoupClient.types.Consumer | undefined {
    return Array.from(this.consumers.values())
      .find(consumer => consumer.producerId === producerId);
  }

  /**
   * Thêm consumer mới
   */
  public addConsumer(consumer: mediasoupClient.types.Consumer): void {
    this.consumers.set(consumer.id, consumer);
  }

  /**
   * Xóa consumer
   */
  public removeConsumer(consumerId: string): void {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(consumerId);
    }
  }

  /**
   * Đóng và xóa consumer theo producer ID
   */
  public closeConsumerByProducerId(producerId: string): void {
    const consumer = this.getConsumerByProducerId(producerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(consumer.id);
    }
  }
}

// Export singleton instance
export const mediaSoupClient = new MediaSoupClient();