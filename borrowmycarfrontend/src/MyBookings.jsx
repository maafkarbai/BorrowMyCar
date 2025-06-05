// Update src/MyBookings.jsx with complete implementation
import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthProvider";
import API from "./api";
import { Helmet } from "react-helmet";

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const endpoint =
        user.role === "owner" ? "/bookings/owner" : "/bookings/me";
      const response = await API.get(endpoint);
      setBookings(response.data.data.bookings || []);
    } catch (err) {
      setError("Failed to fetch bookings");
      console.error("Booking fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await API.put(`/bookings/${bookingId}`, { status: newStatus });
      await fetchBookings(); // Refresh bookings
    } catch (err) {
      setError("Failed to update booking status");
      console.error("Status update error:", err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      active: "bg-purple-100 text-purple-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filterBookings = (status) => {
    if (status === "all") return bookings;
    if (status === "active") {
      return bookings.filter((b) =>
        ["pending", "approved", "confirmed", "active"].includes(b.status)
      );
    }
    return bookings.filter((b) => b.status === status);
  };

  const filteredBookings = filterBookings(activeTab);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Bookings - BorrowMyCar</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user.role === "owner" ? "Booking Requests" : "My Bookings"}
          </h1>
          <p className="text-gray-600">
            {user.role === "owner"
              ? "Manage booking requests for your vehicles"
              : "Track your car rental history and active bookings"}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "all", label: "All Bookings" },
              { id: "active", label: "Active" },
              { id: "pending", label: "Pending" },
              { id: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {filterBookings(tab.id).length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600">
              {activeTab === "all"
                ? "You haven't made any bookings yet."
                : `No ${activeTab} bookings found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Car Info */}
                  <div className="flex items-start gap-4">
                    <img
                      src={booking.car?.images?.[0] || "/placeholder-car.jpg"}
                      alt={booking.car?.title}
                      className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {booking.car?.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {new Date(booking.startDate).toLocaleDateString()} -{" "}
                        {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          {booking.totalDays} day
                          {booking.totalDays !== 1 ? "s" : ""}
                        </span>
                        <span>AED {booking.totalPayable}</span>
                        {user.role === "owner" && booking.renter && (
                          <span>Renter: {booking.renter.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </span>

                    {/* Action Buttons */}
                    {user.role === "owner" && booking.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking._id, "approved")
                          }
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking._id, "rejected")
                          }
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {user.role === "renter" &&
                      ["pending", "approved"].includes(booking.status) && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking._id, "cancelled")
                          }
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Pickup:</span>
                      <span className="ml-2 text-gray-900">
                        {booking.pickupLocation}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Return:</span>
                      <span className="ml-2 text-gray-900">
                        {booking.returnLocation}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment:</span>
                      <span className="ml-2 text-gray-900">
                        {booking.paymentMethod}
                      </span>
                    </div>
                  </div>

                  {booking.renterNotes && (
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">Notes:</span>
                      <p className="text-gray-900 text-sm mt-1">
                        {booking.renterNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyBookings;
