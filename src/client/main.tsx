import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MediaStreamProvider } from "./hooks/useMediaStream";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilesPage from "./pages/ProfilesPage";
import ProfilePage from "./pages/ProfilePage";
import GamePage from "./pages/GamePage";
import VideoCallPage from "./pages/VideoCallPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <GamePage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/app",
    element: <App />,
  },
  {
    path: "/profiles",
    element: <ProfilesPage />,
    children: [
      {
        path: "/profiles/:profileId",
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: "/video/:profileId",
    element: <VideoCallPage />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MediaStreamProvider>
      <RouterProvider router={router} />
    </MediaStreamProvider>
  </StrictMode>
);
