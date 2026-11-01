import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Error from "./component/Error.jsx";
import Sidebar from "./component/SideBar.jsx";
import VideoCard from "./component/VideoCard.jsx";
import ViewVideo from "./component/ViewVideo.jsx";
import SignIn from "./component/SignIn.jsx";
import SignUp from "./component/SignUp.jsx";
import ChannelDetails from "./component/ChannelDetails.jsx";

const feedPage = (
  <>
    <Sidebar />
    <VideoCard />
  </>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: feedPage },
      { path: "search", element: feedPage },
      { path: "channelDetails", element: <ChannelDetails /> },
      { path: "watch/:id", element: <ViewVideo /> },
      { path: "viewing_video/:id", element: <ViewVideo /> },
    ],
    errorElement: <Error />,
  },
  { path: "/SignIn", element: <SignIn /> },
  { path: "/SignUp", element: <SignUp /> },
  { path: "*", element: <Error /> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
