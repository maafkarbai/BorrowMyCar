// src/index.jsx - Fixed Router v7 Implementation
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router-dom";
import App from "./App.jsx";
import BrowseCars from "./BrowseCars.jsx";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";
import CarDetails from "./CarDetails.jsx";
import Checkout from "./pages/Checkout.jsx";
import BookingSuccess from "./pages/BookingSuccess.jsx";
import ListCar from "./ListCar.jsx";
import HowItWorks from "./HowItWorks.jsx";
import MyBookings from "./MyBookings.jsx";
import Settings from "./Settings.jsx";
import Profile from "./Profile.jsx";
import NotFound from "./NotFound.jsx";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { PaymentProvider } from "./context/PaymentContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { HelmetProvider } from "react-helmet-async";
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

// Define routes with React Router v7 syntax
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <App />,
      },
      {
        path: "browse",
        element: <BrowseCars />,
      },
      {
        path: "how-it-works",
        element: <HowItWorks />,
      },
      {
        path: "cars/:id",
        element: <CarDetails />,
      },
      {
        path: "checkout/:carId",
        element: (
          <ProtectedRoute requiredRole="renter">
            <Checkout />
          </ProtectedRoute>
        ),
      },
      {
        path: "booking-success",
        element: (
          <ProtectedRoute>
            <BookingSuccess />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "list-car",
        element: (
          <ProtectedRoute requiredRole="owner" requireApproval={true}>
            <ListCar />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-bookings",
        element: (
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
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
  // Compatibility routes
  {
    path: "/login",
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: "/signup",
    element: <Navigate to="/auth/signup" replace />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <LanguageProvider>
        <AuthProvider>
          <PaymentProvider>
            <RouterProvider router={router} />
          </PaymentProvider>
        </AuthProvider>
      </LanguageProvider>
    </HelmetProvider>
  </StrictMode>
);
