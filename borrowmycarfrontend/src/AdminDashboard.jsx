import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import API from "./api";

// Dashboard Stats Component
const DashboardStats = ({ stats }) => {
  if (!stats) return null;

  const statCards = [
    {
      title: "Total Users",
      value: stats.users.total,
      subtext: `${stats.users.pending} pending approval`,
      color: "blue",
      icon: "👥",
    },
    {
      title: "Total Cars",
      value: stats.cars.total,
      subtext: `${stats.cars.pending} pending approval`,
      color: "green",
      icon: "🚗",
    },
    {
      title: "Total Bookings",
      value: stats.bookings.total,
      subtext: `${stats.bookings.thisMonth} this month`,
      color: "purple",
      icon: "📅",
    },
    {
      title: "Total Revenue",
      value: `AED ${stats.revenue.total?.toLocaleString() || 0}`,
      subtext: `${stats.metrics.fiveStarRatio}% 5-star ratings`,
      color: "yellow",
      icon: "💰",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
            </div>
            <div className={`text-3xl`}>{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Search and Filter Component
const SearchAndFilter = ({
  type,
  searchTerm,
  handleSearch,
  filterRole,
  filterStatus,
  handleFilter,
}) => (
  <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder={`Search ${type}...`}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {type === "users" && (
        <>
          <select
            value={filterRole}
            onChange={(e) => handleFilter("role", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="renter">Renter</option>
            <option value="owner">Owner</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => handleFilter("status", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Approved</option>
            <option value="false">Pending</option>
          </select>
        </>
      )}
      {type === "cars" && (
        <select
          value={filterStatus}
          onChange={(e) => handleFilter("status", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      )}
    </div>
  </div>
);

// Car Card Component
const CarCard = ({ car, updateCarStatus, deleteCar }) => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-4">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center mb-2">
          {car.images && car.images[0] && (
            <img
              src={car.images[0]}
              alt={car.title}
              className="w-16 h-12 rounded mr-3 object-cover"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{car.title}</h3>
            <p className="text-gray-600">
              {car.make} {car.model} ({car.year})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Owner</p>
            <p className="font-medium">{car.owner?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Price</p>
            <p className="font-medium">AED {car.price}/day</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">City</p>
            <p className="font-medium">{car.city}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                car.status === "active"
                  ? "bg-green-100 text-green-800"
                  : car.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {car.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 ml-4">
        {car.status === "pending" && (
          <>
            <button
              onClick={() => updateCarStatus(car._id, "active")}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() =>
                updateCarStatus(car._id, "rejected", "Not meeting requirements")
              }
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          </>
        )}
        <button
          onClick={() => deleteCar(car._id)}
          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// Booking Card Component
const BookingCard = ({ booking }) => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-4">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {booking.car?.title || "Car Details Unavailable"}
            </h3>
            <p className="text-gray-600">
              Renter: {booking.renter?.name} ({booking.renter?.email})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-medium">
              {new Date(booking.startDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">End Date</p>
            <p className="font-medium">
              {new Date(booking.endDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="font-medium">AED {booking.totalPayable}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                booking.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : booking.status === "active"
                  ? "bg-blue-100 text-blue-800"
                  : booking.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {booking.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Payment Status</p>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                booking.paymentStatus === "paid"
                  ? "bg-green-100 text-green-800"
                  : booking.paymentStatus === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {booking.paymentStatus || "pending"}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">
              {new Date(booking.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Pagination Component
const Pagination = ({ currentPagination, onPageChange }) => {
  if (!currentPagination || currentPagination.totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPagination.currentPage - 1)}
        disabled={!currentPagination.hasPrev}
        className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Previous
      </button>
      <span className="px-4 py-2 text-sm text-gray-600">
        Page {currentPagination.currentPage} of {currentPagination.totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPagination.currentPage + 1)}
        disabled={!currentPagination.hasNext}
        className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
};

// User Card Component
const UserCard = ({
  user,
  showActions = true,
  activeTab,
  selectedUsers,
  toggleUserSelection,
  fetchUserDetails,
  approveUser,
  rejectUser,
  deleteUser,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          {activeTab === "users" && (
            <input
              type="checkbox"
              checked={selectedUsers.includes(user._id)}
              onChange={() => toggleUserSelection(user._id)}
              className="mr-3 mt-1"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center mb-2">
              {user.profileImage && (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-12 h-12 rounded-full mr-3"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.name}
                </h3>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{user.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === "owner"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Preferred City</p>
                <p className="font-medium">
                  {user.preferredCity || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    user.isApproved
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user.isApproved ? "Approved" : "Pending"}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Documents</p>
              <div className="flex flex-wrap gap-2">
                {user.drivingLicenseUrl && (
                  <a
                    href={user.drivingLicenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 px-2 py-1 rounded"
                  >
                    Driving License
                  </a>
                )}
                {user.emiratesIdUrl && (
                  <a
                    href={user.emiratesIdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 px-2 py-1 rounded"
                  >
                    Emirates ID
                  </a>
                )}
                {user.visaUrl && (
                  <a
                    href={user.visaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 px-2 py-1 rounded"
                  >
                    Visa
                  </a>
                )}
                {user.passportUrl && (
                  <a
                    href={user.passportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 px-2 py-1 rounded"
                  >
                    Passport
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4">
          <button
            onClick={() => fetchUserDetails(user._id)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
          {showActions && !user.isApproved && (
            <>
              <button
                onClick={() => approveUser(user._id)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => rejectUser(user._id, "Documents not clear")}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => deleteUser(user._id)}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ showUserDetails, setShowUserDetails }) => {
  if (!showUserDetails) return null;

  const { user: userDetails, cars, bookings } = showUserDetails;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
            <button
              onClick={() => setShowUserDetails(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Personal Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-medium">{userDetails.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{userDetails.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium">{userDetails.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Role</label>
                  <p className="font-medium">{userDetails.role}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      userDetails.isApproved
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {userDetails.isApproved ? "Approved" : "Pending"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Account Activity</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Cars Listed</label>
                  <p className="font-medium">{cars.length}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Total Bookings
                  </label>
                  <p className="font-medium">{bookings.length}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Member Since</label>
                  <p className="font-medium">
                    {new Date(userDetails.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {cars.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Listed Cars</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cars.map((car) => (
                  <div
                    key={car._id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <h4 className="font-medium">{car.title}</h4>
                    <p className="text-sm text-gray-600">
                      {car.make} {car.model} ({car.year})
                    </p>
                    <p className="text-sm">Price: AED {car.price}/day</p>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${
                        car.status === "active"
                          ? "bg-green-100 text-green-800"
                          : car.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {car.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// System Configuration Modal
const SystemConfigModal = ({
  showSystemConfig,
  setShowSystemConfig,
  systemConfig,
  updateSystemConfig,
}) => {
  if (!showSystemConfig || !systemConfig) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-gray-900">
              System Configuration
            </h2>
            <button
              onClick={() => setShowSystemConfig(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Auto Approval
                    </label>
                    <p className="text-sm text-gray-500">
                      Automatically approve new users
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.features.autoApproval}
                    onChange={(e) =>
                      updateSystemConfig({ autoApproval: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Maintenance Mode
                    </label>
                    <p className="text-sm text-gray-500">
                      Put the platform in maintenance mode
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.features.maintenanceMode}
                    onChange={(e) =>
                      updateSystemConfig({ maintenanceMode: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Registration Open
                    </label>
                    <p className="text-sm text-gray-500">
                      Allow new user registrations
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.features.registrationOpen}
                    onChange={(e) =>
                      updateSystemConfig({ registrationOpen: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">
                Platform Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Version</label>
                  <p className="font-medium">{systemConfig.platform.version}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Environment</label>
                  <p className="font-medium">
                    {systemConfig.platform.environment}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Max Cars Per Owner
                  </label>
                  <p className="font-medium">
                    {systemConfig.limits.maxCarsPerOwner}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Payment Gateway
                  </label>
                  <p className="font-medium">
                    {systemConfig.features.paymentGateway}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bulk Actions Bar
const BulkActionsBar = ({
  selectedUsers,
  bulkUserAction,
  setSelectedUsers,
}) => {
  if (selectedUsers.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blue-900">
          {selectedUsers.length} users selected
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => bulkUserAction("approve")}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            Approve All
          </button>
          <button
            onClick={() => bulkUserAction("reject", "Bulk rejection")}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Reject All
          </button>
          <button
            onClick={() => bulkUserAction("delete")}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            Delete All
          </button>
          <button
            onClick={() => setSelectedUsers([])}
            className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allCars, setAllCars] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedCars, setSelectedCars] = useState([]);
  const [showUserDetails, setShowUserDetails] = useState(null);
  const [showSystemConfig, setShowSystemConfig] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [systemConfig, setSystemConfig] = useState(null);
  const [pagination, setPagination] = useState({
    users: { page: 1, totalPages: 1 },
    cars: { page: 1, totalPages: 1 },
    bookings: { page: 1, totalPages: 1 },
  });

  // Determine active tab from URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/admin/users")) return "users";
    if (path.includes("/admin/cars")) return "cars";
    if (path.includes("/admin/bookings")) return "bookings";
    if (path.includes("/admin/reports")) return "reports";
    if (path.includes("/admin/settings")) return "settings";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/admin");
      return;
    }
    initializeData();
  }, [user, navigate]);

  const initializeData = async () => {
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchCars(),
      fetchBookings(),
      fetchActivityLog(),
      fetchSystemConfig(),
    ]);
  };

  const fetchStats = async () => {
    try {
      const response = await API.get("/admin/stats");
      if (response.data.success) {
        setStats(response.data.data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchUsers = async (page = 1, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...filters,
      });

      const response = await API.get(`/admin/users?${params}`);

      if (response.data.success) {
        const { users, pagination: userPagination } = response.data.data;
        setAllUsers(users);
        setPendingUsers(users.filter((u) => !u.isApproved));
        setPagination((prev) => ({ ...prev, users: userPagination }));
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchCars = async (page = 1, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...filters,
      });

      const response = await API.get(`/admin/cars?${params}`);

      if (response.data.success) {
        const { cars, pagination: carPagination } = response.data.data;
        setAllCars(cars);
        setPagination((prev) => ({ ...prev, cars: carPagination }));
      }
    } catch (err) {
      console.error("Error fetching cars:", err);
      setError("Failed to fetch cars");
    }
  };

  const fetchBookings = async (page = 1, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...filters,
      });

      const response = await API.get(`/admin/bookings?${params}`);

      if (response.data.success) {
        const { bookings, pagination: bookingPagination } = response.data.data;
        setAllBookings(bookings);
        setPagination((prev) => ({ ...prev, bookings: bookingPagination }));
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to fetch bookings");
    }
  };

  const approveUser = async (userId) => {
    try {
      await API.patch(`/admin/users/${userId}/approve`);
      await Promise.all([fetchUsers(), fetchStats()]);
      setError("");
    } catch (err) {
      console.error("Error approving user:", err);
      setError("Failed to approve user");
    }
  };

  const rejectUser = async (userId, reason = "") => {
    try {
      await API.patch(`/admin/users/${userId}/reject`, { reason });
      await Promise.all([fetchUsers(), fetchStats()]);
      setError("");
    } catch (err) {
      console.error("Error rejecting user:", err);
      setError("Failed to reject user");
    }
  };

  const updateCarStatus = async (carId, status, reason = "") => {
    try {
      await API.patch(`/admin/cars/${carId}/approval`, { status, reason });
      await Promise.all([fetchCars(), fetchStats()]);
      setError("");
    } catch (err) {
      console.error("Error updating car status:", err);
      setError("Failed to update car status");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await API.delete(`/admin/users/${userId}`);
      await Promise.all([fetchUsers(), fetchStats()]);
      setError("");
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user");
    }
  };

  const deleteCar = async (carId) => {
    if (!window.confirm("Are you sure you want to delete this car?")) return;

    try {
      await API.delete(`/admin/cars/${carId}`);
      await Promise.all([fetchCars(), fetchStats()]);
      setError("");
    } catch (err) {
      console.error("Error deleting car:", err);
      setError("Failed to delete car");
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (activeTab === "users") {
      fetchUsers(1, {
        search: term,
        role: filterRole,
        isApproved: filterStatus,
      });
    } else if (activeTab === "cars") {
      fetchCars(1, { search: term, status: filterStatus });
    }
  };

  const handleFilter = (type, value) => {
    if (type === "role") {
      setFilterRole(value);
      fetchUsers(1, {
        search: searchTerm,
        role: value,
        isApproved: filterStatus,
      });
    } else if (type === "status") {
      setFilterStatus(value);
      if (activeTab === "users") {
        fetchUsers(1, {
          search: searchTerm,
          role: filterRole,
          isApproved: value,
        });
      } else if (activeTab === "cars") {
        fetchCars(1, { search: searchTerm, status: value });
      }
    }
  };

  const handleTabChange = (tab) => {
    if (tab === "dashboard") {
      navigate("/admin/dashboard");
    } else {
      navigate(`/admin/${tab}`);
    }
  };

  const fetchActivityLog = async () => {
    try {
      const response = await API.get("/admin/activity-log");
      if (response.data.success) {
        setActivityLog(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching activity log:", err);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const response = await API.get("/admin/config");
      if (response.data.success) {
        setSystemConfig(response.data.data.config);
      }
    } catch (err) {
      console.error("Error fetching system config:", err);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await API.get(`/admin/users/${userId}/details`);
      if (response.data.success) {
        setShowUserDetails(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      setError("Failed to fetch user details");
    }
  };

  const bulkUserAction = async (action, reason = "") => {
    if (selectedUsers.length === 0) {
      setError("Please select users first");
      return;
    }

    const actionText =
      action === "approve"
        ? "approve"
        : action === "reject"
        ? "reject"
        : "delete";
    if (
      !window.confirm(
        `Are you sure you want to ${actionText} ${selectedUsers.length} users?`
      )
    ) {
      return;
    }

    try {
      await API.post("/admin/users/bulk-actions", {
        userIds: selectedUsers,
        action,
        reason,
      });

      await Promise.all([fetchUsers(), fetchStats()]);
      setSelectedUsers([]);
      setError("");
    } catch (err) {
      console.error(`Error ${actionText}ing users:`, err);
      setError(`Failed to ${actionText} users`);
    }
  };

  const exportData = async (type) => {
    try {
      const response = await API.get(`/admin/export?type=${type}`);
      if (response.data.success) {
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${type}_export_${
          new Date().toISOString().split("T")[0]
        }.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(`Error exporting ${type}:`, err);
      setError(`Failed to export ${type}`);
    }
  };

  const updateSystemConfig = async (configUpdates) => {
    try {
      await API.patch("/admin/config", configUpdates);
      await fetchSystemConfig();
      setError("");
    } catch (err) {
      console.error("Error updating system config:", err);
      setError("Failed to update system configuration");
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === allUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(allUsers.map((user) => user._id));
    }
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | BorrowMyCar</title>
      </Helmet>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow-sm">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === "dashboard" && "Dashboard Overview"}
              {activeTab === "users" && "User Management"}
              {activeTab === "cars" && "Car Management"}
              {activeTab === "bookings" && "Booking Management"}
              {activeTab === "reports" && "Reports & Analytics"}
              {activeTab === "settings" && "System Settings"}
            </h1>
            <p className="mt-1 text-gray-600">
              {activeTab === "dashboard" &&
                "Monitor platform statistics and recent activity"}
              {activeTab === "users" && "Manage user accounts and approvals"}
              {activeTab === "cars" && "Oversee car listings and approvals"}
              {activeTab === "bookings" && "Track all booking transactions"}
              {activeTab === "reports" && "Generate reports and export data"}
              {activeTab === "settings" &&
                "Configure system settings and preferences"}
            </p>
          </div>
        </div>

        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {activeTab === "dashboard" && (
                <>
                  <DashboardStats stats={stats} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Recent Activity
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          <span className="text-gray-600">
                            {stats?.users.pending || 0} users pending approval
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                          <span className="text-gray-600">
                            {stats?.cars.pending || 0} cars pending approval
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          <span className="text-gray-600">
                            {stats?.bookings.active || 0} active bookings
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Quick Actions
                      </h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleTabChange("users")}
                          className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                        >
                          Review Pending Users
                        </button>
                        <button
                          onClick={() => handleTabChange("cars")}
                          className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                        >
                          Manage Cars
                        </button>
                        <button
                          onClick={() => handleTabChange("bookings")}
                          className="w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                        >
                          View Bookings
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "users" && (
                <>
                  {/* Quick stats for users */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <span className="text-2xl">⏳</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Pending Approval
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {pendingUsers.length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <span className="text-2xl">✅</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Approved Users
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {allUsers.filter((u) => u.isApproved).length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <span className="text-2xl">👥</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Users
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {allUsers.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <SearchAndFilter
                    type="users"
                    searchTerm={searchTerm}
                    handleSearch={handleSearch}
                    filterRole={filterRole}
                    filterStatus={filterStatus}
                    handleFilter={handleFilter}
                  />

                  {pendingUsers.length > 0 && filterStatus !== "true" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-2">⚠️</span>
                        <h3 className="text-lg font-medium text-yellow-800">
                          Pending Approvals
                        </h3>
                      </div>
                      <p className="text-yellow-700 mt-1">
                        {pendingUsers.length} users are waiting for approval.
                        Review and approve them to give access.
                      </p>
                    </div>
                  )}

                  {allUsers.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                      <div className="flex justify-between items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              selectedUsers.length === allUsers.length &&
                              allUsers.length > 0
                            }
                            onChange={selectAllUsers}
                            className="mr-2"
                          />
                          Select All ({allUsers.length} users)
                        </label>
                        {selectedUsers.length > 0 && (
                          <span className="text-sm text-blue-600 font-medium">
                            {selectedUsers.length} selected
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <BulkActionsBar
                    selectedUsers={selectedUsers}
                    bulkUserAction={bulkUserAction}
                    setSelectedUsers={setSelectedUsers}
                  />
                  {allUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">👥</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No users found
                      </h3>
                      <p className="text-gray-600">No registered users yet</p>
                    </div>
                  ) : (
                    <>
                      {allUsers.map((user) => (
                        <UserCard
                          key={user._id}
                          user={user}
                          showActions={!user.isApproved}
                          activeTab={activeTab}
                          selectedUsers={selectedUsers}
                          toggleUserSelection={toggleUserSelection}
                          fetchUserDetails={fetchUserDetails}
                          approveUser={approveUser}
                          rejectUser={rejectUser}
                          deleteUser={deleteUser}
                        />
                      ))}
                      <Pagination
                        currentPagination={pagination.users}
                        onPageChange={(page) =>
                          fetchUsers(page, {
                            search: searchTerm,
                            role: filterRole,
                            isApproved: filterStatus,
                          })
                        }
                      />
                    </>
                  )}
                </>
              )}

              {activeTab === "cars" && (
                <>
                  <SearchAndFilter
                    type="cars"
                    searchTerm={searchTerm}
                    handleSearch={handleSearch}
                    filterRole={filterRole}
                    filterStatus={filterStatus}
                    handleFilter={handleFilter}
                  />
                  {allCars.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">🚗</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No cars found
                      </h3>
                      <p className="text-gray-600">No cars listed yet</p>
                    </div>
                  ) : (
                    <>
                      {allCars.map((car) => (
                        <CarCard
                          key={car._id}
                          car={car}
                          updateCarStatus={updateCarStatus}
                          deleteCar={deleteCar}
                        />
                      ))}
                      <Pagination
                        currentPagination={pagination.cars}
                        onPageChange={(page) =>
                          fetchCars(page, {
                            search: searchTerm,
                            status: filterStatus,
                          })
                        }
                      />
                    </>
                  )}
                </>
              )}

              {activeTab === "bookings" && (
                <>
                  {allBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📅</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No bookings found
                      </h3>
                      <p className="text-gray-600">No bookings made yet</p>
                    </div>
                  ) : (
                    <>
                      {allBookings.map((booking) => (
                        <BookingCard key={booking._id} booking={booking} />
                      ))}
                      <Pagination
                        currentPagination={pagination.bookings}
                        onPageChange={(page) => fetchBookings(page)}
                      />
                    </>
                  )}
                </>
              )}

              {activeTab === "reports" && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Export Data
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Users Data</h4>
                            <p className="text-sm text-gray-600">
                              Export all user information
                            </p>
                          </div>
                          <button
                            onClick={() => exportData("users")}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                          >
                            Export Users
                          </button>
                        </div>

                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Cars Data</h4>
                            <p className="text-sm text-gray-600">
                              Export all car listings
                            </p>
                          </div>
                          <button
                            onClick={() => exportData("cars")}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                          >
                            Export Cars
                          </button>
                        </div>

                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Bookings Data</h4>
                            <p className="text-sm text-gray-600">
                              Export all booking records
                            </p>
                          </div>
                          <button
                            onClick={() => exportData("bookings")}
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                          >
                            Export Bookings
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Recent Activity
                      </h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {activityLog.recentUsers?.map((user, index) => (
                          <div
                            key={`user-${index}`}
                            className="flex items-center justify-between py-2 border-b border-gray-100"
                          >
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-gray-500">
                                {user.isApproved ? "Approved" : "Pending"} •{" "}
                                {new Date(user.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                user.isApproved
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {user.role}
                            </span>
                          </div>
                        ))}

                        {activityLog.recentCars?.map((car, index) => (
                          <div
                            key={`car-${index}`}
                            className="flex items-center justify-between py-2 border-b border-gray-100"
                          >
                            <div>
                              <p className="text-sm font-medium">{car.title}</p>
                              <p className="text-xs text-gray-500">
                                by {car.owner?.name} •{" "}
                                {new Date(car.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                car.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : car.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {car.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "settings" && (
                <>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        System Settings
                      </h3>
                      <button
                        onClick={() => setShowSystemConfig(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Configure System
                      </button>
                    </div>

                    {systemConfig && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Platform Status
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Environment:
                              </span>
                              <span className="text-sm font-medium">
                                {systemConfig.platform.environment}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Version:
                              </span>
                              <span className="text-sm font-medium">
                                {systemConfig.platform.version}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Maintenance Mode:
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  systemConfig.features.maintenanceMode
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {systemConfig.features.maintenanceMode
                                  ? "ON"
                                  : "OFF"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Registration Settings
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Registration Open:
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  systemConfig.features.registrationOpen
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {systemConfig.features.registrationOpen
                                  ? "YES"
                                  : "NO"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Auto Approval:
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  systemConfig.features.autoApproval
                                    ? "text-green-600"
                                    : "text-orange-600"
                                }`}
                              >
                                {systemConfig.features.autoApproval
                                  ? "ENABLED"
                                  : "MANUAL"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            System Limits
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Max Cars/Owner:
                              </span>
                              <span className="text-sm font-medium">
                                {systemConfig.limits.maxCarsPerOwner}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Max Bookings/User:
                              </span>
                              <span className="text-sm font-medium">
                                {systemConfig.limits.maxBookingsPerUser}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Max Image Size:
                              </span>
                              <span className="text-sm font-medium">
                                {systemConfig.limits.maxImageSize}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <UserDetailsModal
        showUserDetails={showUserDetails}
        setShowUserDetails={setShowUserDetails}
      />
      <SystemConfigModal
        showSystemConfig={showSystemConfig}
        setShowSystemConfig={setShowSystemConfig}
        systemConfig={systemConfig}
        updateSystemConfig={updateSystemConfig}
      />
    </>
  );
};
export default AdminDashboard;
