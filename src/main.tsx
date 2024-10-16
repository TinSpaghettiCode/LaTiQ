import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import ProfilesPage from "./pages/ProfilesPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import GamePage from "./pages/GamePage.tsx";

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
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
