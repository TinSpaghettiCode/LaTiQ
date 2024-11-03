import { MediaSoupClient } from "../../client/services/mediasoup.client";
import { MediaSoupSocket } from "../../client/services/mediasoup.socket";
import { useRef, useEffect, useState } from "react";
// import { useLocation } from "react-router-dom";

export default function VideoCallPage() {
  // const location = useLocation();
  // const { player, videoStream } = location.state || {};
  const videoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [mediaSoupClient] = useState(() => new MediaSoupClient());
  const [mediaSoupSocket] = useState(
    () => new MediaSoupSocket("ws://localhost:3000")
  );

  useEffect(() => {
    const initializeMediaSoup = async () => {
      try {
        // 1. Kết nối WebSocket
        await mediaSoupSocket.connect();

        // 2. Lấy local stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Hiển thị local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 3. Khởi tạo device và transport
        const routerRtpCapabilities = await mediaSoupSocket.send(
          "getRouterRtpCapabilities",
          {}
        );
        await mediaSoupClient.loadDevice(routerRtpCapabilities);

        // 4. Tạo producer transport
        const transportParams = await mediaSoupSocket.send(
          "createProducerTransport",
          {}
        );
        await mediaSoupClient.createProducerTransport(transportParams);

        // 5. Produce video và audio tracks
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) {
          await mediaSoupClient.produce(videoTrack);
        }
        if (audioTrack) {
          await mediaSoupClient.produce(audioTrack);
        }
      } catch (error) {
        console.error("Failed to initialize MediaSoup:", error);
      }
    };

    initializeMediaSoup();

    return () => {
      // Cleanup
      mediaSoupClient.close();
      mediaSoupSocket.close();
    };
  }, [mediaSoupClient, mediaSoupSocket]);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div>
        <h2>Local Video</h2>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto bg-black"
        />
      </div>
      <div>
        <h2>Remote Video</h2>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-auto bg-black"
        />
      </div>
    </div>
  );
}
