// src/index.jsx - Updated with PaymentProvider
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
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
import { PaymentProvider } from "./context/PaymentContext.jsx"; // NEW
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
      { index: true, element: <App /> },
      { path: "browse", element: <BrowseCars /> },
      { path: "how-it-works", element: <HowItWorks /> },
      { path: "cars/:id", element: <CarDetails /> },
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
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
    ],
  },
  // Keep login/signup at root level for backward compatibility
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "*", element: <NotFound /> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <PaymentProvider>
        <RouterProvider router={router} />
      </PaymentProvider>
    </AuthProvider>
  </StrictMode>
);
