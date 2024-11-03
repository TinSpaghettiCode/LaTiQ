export interface WebSocketMessage {
    type: string;
    data: any;
    requestId?: string;
  }
  
  export interface TransportOptions {
    id: string;
    iceParameters: any;
    iceCandidates: any[];
    dtlsParameters: any;
  }
  
  export interface ConsumerOptions {
    id: string;
    producerId: string;
    kind: 'audio' | 'video';
    rtpParameters: any;
    appData?: any;
  }
  
  export interface ProducerOptions {
    id: string;
    kind: 'audio' | 'video';
    rtpParameters: any;
    appData?: any;
  }