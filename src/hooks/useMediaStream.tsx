import { createContext, useContext, useState } from "react";

// Define the type for the context value
interface MediaStreamContextType {
  mediaStream: MediaStream | null;
  setMediaStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
}

const MediaStreamContext = createContext<MediaStreamContextType | null>(null);

export const useMediaStream = () => {
  const context = useContext(MediaStreamContext);
  if (!context) {
    throw new Error("useMediaStream must be used within a MediaStreamProvider");
  }
  return context;
};

// Define the type for the provider's props
interface MediaStreamProviderProps {
  children: React.ReactNode;
}

// MediaStreamProvider component
export const MediaStreamProvider: React.FC<MediaStreamProviderProps> = ({
  children,
}) => {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  return (
    <MediaStreamContext.Provider value={{ mediaStream, setMediaStream }}>
      {children}
    </MediaStreamContext.Provider>
  );
};
