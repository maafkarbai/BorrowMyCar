import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import App from "./App.jsx";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";
import CarDetails from "./CarDetails.jsx";
import ListCar from "./ListCar.jsx";
import NotFound from "./NotFound.jsx";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import "./global.css";

// Main Layout Component
const Layout = () => (
  <>
    <Navbar />
    <main className="min-h-screen">
      <Outlet />
    </main>
    <Footer />
  </>
);

// Auth Layout (no navbar/footer for login/signup)
const AuthLayout = () => (
  <main className="min-h-screen">
    <Outlet />
  </main>
);

// Define routes properly
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <App />,
      },
      {
        path: "browse",
        element: <App />,
      },
      {
        path: "cars/:id",
        element: <CarDetails />,
      },
      {
        path: "list-car",
        element: <ListCar />,
      },
      // Add other protected routes here
    ],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "signup",
        element: <Signup />,
      },
    ],
  },
  // Keep login/signup at root level for backward compatibility
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
