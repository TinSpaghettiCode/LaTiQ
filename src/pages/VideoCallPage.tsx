import { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function VideoCallPage() {
  const location = useLocation();
  const { player, videoStream } = location.state || {};
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
    console.log(videoRef.current, "videoooo");
  }, [videoStream]);

  return (
    <div>
      <h1>Video Call with {player?.name}</h1>
      {videoStream && (
        <video ref={videoRef} autoPlay className="w-full h-auto" />
      )}
    </div>
  );
}
