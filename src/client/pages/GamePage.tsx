import { useEffect, useRef, useState } from "react";
import {
  FaVideo,
  FaMicrophone,
  FaVideoSlash,
  FaMicrophoneSlash,
  FaPencilAlt,
  FaEraser,
  FaUndo,
  FaRedo,
  FaPalette,
  FaSmile,
} from "react-icons/fa";
import { BsChatDots, BsPeopleFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useMediaStream } from "@/hooks/useMediaStream";

export default function GamePage() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [selectedTool, setSelectedTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  /* Setup Media Stream */
  const { setMediaStream } = useMediaStream();

  console.log(setMediaStream, "Media Stream");

  const players = [
    {
      id: 1,
      name: "Player 1",
      avatar:
        "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80",
    },
    {
      id: 2,
      name: "Player 2",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    },
    {
      id: 3,
      name: "Player 3",
      avatar:
        "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80",
    },
    {
      id: 4,
      name: "Player 4",
      avatar:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
    },
    {
      id: 5,
      name: "Player 5",
      avatar:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
    },
  ];

  const rooms = [
    { id: 1, name: "Fun Room", players: 5 },
    { id: 2, name: "Pro Artists", players: 8 },
    { id: 3, name: "Beginners Welcome", players: 3 },
  ];

  const messages = [
    { id: 1, player: "Player 1", message: "Hello everyone!" },
    { id: 2, player: "Player 2", message: "Hey there! Ready to play?" },
    { id: 3, player: "Player 3", message: "Let's start the game!" },
  ];

  const toggleCamera = () => setIsCameraOn(!isCameraOn);
  const toggleMic = () => setIsMicOn(!isMicOn);

  useEffect(() => {
    if (isCameraOn) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          streamRef.current = stream;
          videoRefs.current.forEach((videoRef) => {
            if (videoRef) {
              videoRef.srcObject = stream;
            }
          });
        })
        .catch((err) => {
          console.error("Error accessing camera: ", err);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      videoRefs.current.forEach((videoRef) => {
        if (videoRef) {
          videoRef.srcObject = null;
        }
      });
    }
  }, [isCameraOn]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100 overflow-y-auto scrollbar-hide">
      <header className="bg-blue-500 text-white p-4 rounded-b-xl">
        <h1 className="text-2xl font-bold text-center">LaTiQ</h1>
      </header>
      <main className="flex-grow flex flex-col md:flex-row p-4 space-y-4 md:space-y-0 md:space-x-4 overflow-hidden">
        <div className="flex-grow flex flex-col space-y-4 md:w-3/4">
          <div className="bg-white rounded-xl shadow-md p-4 flex-grow">
            <canvas className="w-full h-full border-2 border-gray-300 rounded-xl md:h-auto" />
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                className={`p-2 rounded-xl ${
                  selectedTool === "pencil"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setSelectedTool("pencil")}
              >
                <FaPencilAlt />
              </button>
              <button
                className={`p-2 rounded-xl ${
                  selectedTool === "eraser"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setSelectedTool("eraser")}
              >
                <FaEraser />
              </button>
              <button className="p-2 rounded-xl bg-gray-200">
                <FaUndo />
              </button>
              <button className="p-2 rounded-xl bg-gray-200">
                <FaRedo />
              </button>
              <div className="flex items-center space-x-2">
                <FaPalette className="text-gray-600" />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-xl"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                className={`p-2 rounded-xl ${
                  isCameraOn ? "bg-red-500" : "bg-gray-200"
                }`}
                onClick={toggleCamera}
              >
                {isCameraOn ? <FaVideo /> : <FaVideoSlash />}
              </button>
              <button
                className={`p-2 rounded-xl ${
                  isMicOn ? "bg-red-500" : "bg-gray-200"
                }`}
                onClick={toggleMic}
              >
                {isMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-4 md:w-1/4">
          <div
            className="scrollbar-hide bg-white rounded-xl shadow-md p-4 flex-grow overflow-y-auto"
            style={{ minHeight: "300px" }}
          >
            <h2 className="text-xl font-semibold mb-4">Players</h2>
            <div className="grid grid-cols-2 gap-4">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="relative flex flex-col items-center hover:bg-gray-200 p-2 rounded-lg cursor-pointer"
                  onClick={() =>
                    navigate(`/video/${player.id}`, {
                      state: {
                        player,
                        videoStream: videoRefs.current[index]?.srcObject,
                      },
                    })
                  }
                >
                  {isCameraOn ? (
                    <video
                      ref={(el) => (videoRefs.current[index] = el)}
                      autoPlay
                      className="w-16 h-16 rounded-full object-cover"
                      onClick={(e) => e.stopPropagation()} // Prevent click event from propagating
                    />
                  ) : (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <span className="mt-2 text-sm font-medium">
                    {player.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Transcript here</h2>
            <ul className="space-y-2 scrollbar-hide">
              {rooms.map((room) => (
                <li
                  key={room.id}
                  className="flex justify-between items-center p-2 bg-gray-100 rounded-xl"
                >
                  <span>{room.name}</span>
                  <span className="text-sm text-gray-600">
                    <BsPeopleFill className="inline mr-1" />
                    {room.players}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col h-64">
            <h2 className="text-xl font-semibold mb-4">Chat</h2>
            <div className="flex-grow overflow-y-auto space-y-2 mb-4 scrollbar-hide">
              {messages.map((msg) => (
                <div key={msg.id} className="p-2 bg-gray-100 rounded-xl">
                  <span className="font-medium">{msg.player}: </span>
                  <span>{msg.message}</span>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-grow p-2 border rounded-xl"
              />
              <button className="p-2 bg-blue-500 text-white rounded-xl">
                <BsChatDots />
              </button>
              <button className="p-2 bg-gray-200 rounded-xl">
                <FaSmile />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
