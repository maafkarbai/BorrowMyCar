import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CarFilterBar from "./CarFilterBar";
import API from "./api";

const CarListingSection = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 12,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch cars with filters
  const fetchCars = async (page = 1, newFilters = filters) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...newFilters,
      });

      // Remove empty filter values
      Object.keys(newFilters).forEach((key) => {
        if (!newFilters[key]) {
          params.delete(key);
        }
      });

      console.log("Fetching cars with params:", params.toString());

      const response = await API.get(`/cars?${params.toString()}`);
      console.log("Cars API response:", response.data);

      // Handle different response structures
      let carsData = [];
      let paginationData = {};

      if (response.data.data) {
        carsData = response.data.data.cars || response.data.data;
        paginationData = response.data.data.pagination || {};
      } else if (response.data.cars) {
        carsData = response.data.cars;
        paginationData = response.data.pagination || {};
      } else {
        carsData = Array.isArray(response.data) ? response.data : [];
      }

      setCars(carsData);
      setPagination((prev) => ({
        ...prev,
        currentPage: page,
        ...paginationData,
      }));
    } catch (err) {
      console.error("Error fetching cars:", err);
      setError("Failed to load cars. Please try again.");
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCars();
  }, [sortBy, sortOrder]);

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    fetchCars(1, newFilters); // Reset to page 1 when filters change
  };

  // Handle filter reset
  const handleFiltersReset = () => {
    setFilters({});
    fetchCars(1, {});
  };

  // Handle pagination
  const handlePageChange = (page) => {
    fetchCars(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle sorting
  const handleSortChange = (newSortBy, newSortOrder = "desc") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  // Car Card Component with proper price handling
  const CarCard = ({ car }) => {
    // Handle different price field names
    const getCarPrice = () => {
      return car.price || car.pricePerDay || car.dailyRate || 0;
    };

    const carPrice = getCarPrice();

    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Car Image */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden">
          <img
            src={
              car.images?.[0] ||
              "https://via.placeholder.com/400x240?text=No+Image"
            }
            alt={car.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src =
                "https://via.placeholder.com/400x240?text=Car+Image";
            }}
          />

          {/* Price Badge */}
          <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            AED {carPrice}/day
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 left-3 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            {car.status === "active" ? "Available" : car.status || "Available"}
          </div>
        </div>

        {/* Car Details */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
              {car.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {car.description}
            </p>
          </div>

          {/* Car Info */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{car.city}</span>
            </div>
            {car.year && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{car.year}</span>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{car.transmission || "Automatic"}</span>
            <span>{car.fuelType || "Petrol"}</span>
            {car.mileage && <span>{car.mileage} km</span>}
          </div>

          {/* Action Button */}
          <Link
            to={`/cars/${car._id}`}
            className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    );
  };

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-pulse"
        >
          <div className="aspect-video bg-gray-200"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Pagination Component
  const Pagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, pagination.currentPage - halfVisible);
    let endPage = Math.min(
      pagination.totalPages,
      startPage + maxVisiblePages - 1
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {/* Page Numbers */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${
              page === pagination.currentPage
                ? "bg-green-600 text-white"
                : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Filter Bar */}
      <CarFilterBar
        onFiltersChange={handleFiltersChange}
        onReset={handleFiltersReset}
      />

      {/* Results Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Available Cars</h2>
          {!loading && (
            <span className="text-gray-600 text-sm">
              {pagination.totalCount || cars.length} cars found
            </span>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              handleSortChange(field, order);
            }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-green-500 outline-none"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="title-asc">Name: A to Z</option>
            <option value="title-desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Cars
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchCars()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingSkeleton />}

      {/* Empty State */}
      {!loading && !error && cars.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Cars Found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or search criteria to find more cars.
          </p>
          <button
            onClick={handleFiltersReset}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Cars Grid */}
      {!loading && !error && cars.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cars.map((car) => (
              <CarCard key={car._id} car={car} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination />
        </>
      )}
    </div>
  );
};

export default CarListingSection;
