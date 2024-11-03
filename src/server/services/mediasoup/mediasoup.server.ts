import * as mediasoup from "mediasoup";
import { EventEmitter } from "../../../shared/types/EventEmitter.js";

/* Cấu hình tùy chọn cho MediaSoup Server */
interface MediaSoupServerOptions {
  worker?: {
    logLevel?: "debug" | "warn" | "error" | "none";
    logTags?: string[];
    rtcMinPort?: number;
    rtcMaxPort?: number;
  };
  router?: {
    mediaCodecs?: mediasoup.types.RtpCodecCapability[];
  };
  webRtcTransport?: {
    listenIps?: { ip: string; announcedIp?: string }[];
    initialAvailableOutgoingBitrate?: number;
  };
}

/**
 * MediaSoupServer - Quản lý phía server của WebRTC và media streaming
 */
export class MediaSoupServer extends EventEmitter {
  // Các thành phần cốt lõi của MediaSoup Server
  private worker: mediasoup.types.Worker | null = null;
  private router: mediasoup.types.Router | null = null;
  private webRtcServer: mediasoup.types.WebRtcServer<mediasoup.types.AppData> | null = null;
  
  // Map lưu trữ các producer và consumer
  private producers: Map<string, mediasoup.types.Producer> = new Map();
  private consumers: Map<string, mediasoup.types.Consumer> = new Map();
  private transports: Map<string, mediasoup.types.WebRtcTransport> = new Map();

  constructor(private options: MediaSoupServerOptions = {}) {
    super();
    // ... (giữ nguyên phần constructor như cũ)
  }

  /**
   * Khởi tạo MediaSoup Server
   */
  public async init(): Promise<void> {
    try {
      // 1. Khởi tạo Worker
      this.worker = await mediasoup.createWorker({
        logLevel: this.options.worker?.logLevel,
        logTags: this.options.worker?.logTags as mediasoup.types.WorkerLogTag[],
        rtcMinPort: this.options.worker?.rtcMinPort,
        rtcMaxPort: this.options.worker?.rtcMaxPort,
      });

      // Xử lý sự kiện worker die
      this.worker.on("died", () => {
        console.error("mediasoup worker died, exiting in 2 seconds... [pid:%d]", this.worker?.pid);
        setTimeout(() => process.exit(1), 2000);
      });

      // 2. Khởi tạo WebRTC Server
      this.webRtcServer = await this.worker.createWebRtcServer({
        listenInfos: [
          {
            protocol: "udp",
            ip: "0.0.0.0",
            announcedIp: "127.0.0.1",
            port: 44444,
          },
          {
            protocol: "tcp",
            ip: "0.0.0.0",
            announcedIp: "127.0.0.1",
            port: 44444,
          },
        ],
      });

      // 3. Khởi tạo Router
      this.router = await this.worker.createRouter({
        mediaCodecs: this.options.router?.mediaCodecs,
      });

      console.log("MediaSoup Server initialized successfully");
    } catch (error) {
      console.error("Failed to initialize MediaSoup Server:", error);
      throw error;
    }
  }

  /**
   * Tạo WebRTC Transport
   */
  public async createTransport(): Promise<mediasoup.types.WebRtcTransport> {
    if (!this.router || !this.webRtcServer) {
      throw new Error("Router or WebRtcServer not initialized");
    }

    const transport = await this.router.createWebRtcTransport({
      webRtcServer: this.webRtcServer,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: this.options.webRtcTransport?.initialAvailableOutgoingBitrate,
    });

    this.transports.set(transport.id, transport);
    return transport;
  }

    /**
   * Tạo producer để phát media
   * @param transportId ID của transport
   * @param params Thông tin producer
   */
    public async produce(
        transportId: string,
        params: {
          kind: mediasoup.types.MediaKind;
          rtpParameters: mediasoup.types.RtpParameters;
          paused?: boolean;
          keyFrameRequestDelay?: number;
          appData?: any;
        }
      ): Promise<mediasoup.types.Producer> {
        const transport = this.transports.get(transportId);
        if (!transport) {
          throw new Error(`Transport not found: ${transportId}`);
        }
    
        const producer = await transport.produce(params);
        this.producers.set(producer.id, producer);
    
        producer.on("transportclose", () => {
          producer.close();
          this.producers.delete(producer.id);
        });
    
        return producer;
      }
    
      /**
       * Tạo consumer để nhận media
       * @param transportId ID của transport
       * @param params Thông tin consumer
       */
      public async consume(
        transportId: string,
        params: {
          producerId: string;
          rtpCapabilities: mediasoup.types.RtpCapabilities;
        }
      ): Promise<mediasoup.types.Consumer> {
        const transport = this.transports.get(transportId);
        if (!transport) {
          throw new Error(`Transport not found: ${transportId}`);
        }
    
        if (!this.router) {
          throw new Error("Router not initialized");
        }
    
        if (
          !this.router.canConsume({
            producerId: params.producerId,
            rtpCapabilities: params.rtpCapabilities,
          })
        ) {
          throw new Error("Cannot consume the producer");
        }
    
        const consumer = await transport.consume({
          producerId: params.producerId,
          rtpCapabilities: params.rtpCapabilities,
          paused: true,
        });
    
        this.consumers.set(consumer.id, consumer);
    
        consumer.on("transportclose", () => {
          consumer.close();
      this.consumers.delete(consumer.id);
    });

    return consumer;
  }

  /**
   * Kết nối transport
   * @param transportId ID của transport
   * @param dtlsParameters Thông số DTLS
   */
  public async connectTransport(
    transportId: string,
    dtlsParameters: mediasoup.types.DtlsParameters
  ): Promise<void> {
    const transport = this.transports.get(transportId);
    if (!transport) {
      throw new Error(`Transport not found: ${transportId}`);
    }

    await transport.connect({ dtlsParameters });
  }

  /**
   * Lấy producer theo ID
   */
  public getProducer(producerId: string): mediasoup.types.Producer | undefined {
    return this.producers.get(producerId);
  }

  /**
   * Lấy consumer theo ID
   */
  public getConsumer(consumerId: string): mediasoup.types.Consumer | undefined {
    return this.consumers.get(consumerId);
  }

  /**
   * Lấy transport theo ID
   */
  public getTransport(transportId: string): mediasoup.types.WebRtcTransport | undefined {
    return this.transports.get(transportId);
  }

  /**
   * Lấy khả năng RTP của router
   */
  public get routerCapabilities(): mediasoup.types.RtpCapabilities | null {
    return this.router?.rtpCapabilities || null;
  }

  /**
   * Đóng server và giải phóng tài nguyên
   */
  public async close(): Promise<void> {
    this.producers.forEach((producer) => producer.close());
    this.consumers.forEach((consumer) => consumer.close());
    this.transports.forEach((transport) => transport.close());

    if (this.router) {
      await this.router.close();
    }
    if (this.webRtcServer) {
      await this.webRtcServer.close();
    }
    if (this.worker) {
      await this.worker.close();
    }

    this.producers.clear();
    this.consumers.clear();
    this.transports.clear();
    this.router = null;
    this.webRtcServer = null;
    this.worker = null;
  }
}

// Export singleton instance
export const mediaSoupServer = new MediaSoupServer();
