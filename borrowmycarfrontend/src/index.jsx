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
import AdminDashboard from "./AdminDashboard.jsx";
import AdminLogin from "./AdminLogin.jsx";
import AdminLayout from "./AdminLayout.jsx";
import SellerDashboard from "./SellerDashboard.jsx";
import ListingManagement from "./ListingManagement.jsx";
import OrderManagement from "./OrderManagement.jsx";
import NotFound from "./NotFound.jsx";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { AdminAuthProvider } from "./context/AdminAuthProvider.jsx";
import { PaymentProvider } from "./context/PaymentContext.jsx";
import { HelmetProvider } from "react-helmet-async";
import "./global.css";
import "./i18n";

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
      {
        path: "seller/dashboard",
        element: (
          <ProtectedRoute requiredRole="owner" requireApproval={true}>
            <SellerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "seller/listings",
        element: (
          <ProtectedRoute requiredRole="owner" requireApproval={true}>
            <ListingManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "seller/orders",
        element: (
          <ProtectedRoute requiredRole="owner" requireApproval={true}>
            <OrderManagement />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/admin",
    children: [
      {
        index: true,
        element: <AdminLogin />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        ),
        children: [
          {
            index: true,
            element: <AdminDashboard />,
          },
        ],
      },
      {
        path: "users",
        element: (
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        ),
        children: [
          {
            index: true,
            element: <AdminDashboard />,
          },
        ],
      },
      {
        path: "cars",
        element: (
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        ),
        children: [
          {
            index: true,
            element: <AdminDashboard />,
          },
        ],
      },
      {
        path: "bookings",
        element: (
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        ),
        children: [
          {
            index: true,
            element: <AdminDashboard />,
          },
        ],
      },
      {
        path: "reports",
        element: (
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        ),
        children: [
          {
            index: true,
            element: <AdminDashboard />,
          },
        ],
      },
      {
        path: "settings",
        element: (
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        ),
        children: [
          {
            index: true,
            element: <AdminDashboard />,
          },
        ],
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
      <AuthProvider>
        <AdminAuthProvider>
          <PaymentProvider>
            <RouterProvider router={router} />
          </PaymentProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </HelmetProvider>
  </StrictMode>
);
