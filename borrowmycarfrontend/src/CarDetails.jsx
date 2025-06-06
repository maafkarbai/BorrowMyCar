import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import API from "./api";

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState({
    startDate: "",
    endDate: "",
  });
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [numberOfDays, setNumberOfDays] = useState(0);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await API.get(`/cars/${id}`);
        console.log("Car data response:", res.data);

        // Handle different response structures
        let carData = null;
        if (res.data.data?.car) {
          carData = res.data.data.car;
        } else if (res.data.car) {
          carData = res.data.car;
        } else if (res.data.data && !res.data.data.car) {
          carData = res.data.data;
        } else {
          carData = res.data;
        }

        setCar(carData);
      } catch (err) {
        console.error("Error fetching car:", err);
        setError("Car not found or failed to load");
      } finally {
        setLoading(false);
      }
    };

    const getUser = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUser(payload);
        } catch {
          setUser(null);
        }
      }
    };

    fetchCar();
    getUser();
  }, [id]);

  // Calculate total cost and days when dates change
  useEffect(() => {
    if (booking.startDate && booking.endDate && car) {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        setNumberOfDays(diffDays);
        // Use car.price, car.pricePerDay, or car.dailyRate
        const dailyRate = car.price || car.pricePerDay || car.dailyRate || 0;
        setTotalCost(diffDays * dailyRate);
      } else {
        setNumberOfDays(0);
        setTotalCost(0);
      }
    } else {
      setNumberOfDays(0);
      setTotalCost(0);
    }
  }, [booking.startDate, booking.endDate, car]);

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBooking((prev) => ({
      ...prev,
      [name]: value,
    }));
    setBookingError("");
  };

  const validateBookingDates = () => {
    if (!booking.startDate || !booking.endDate) {
      setBookingError("Please select both start and end dates");
      return false;
    }

    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      setBookingError("Start date cannot be in the past");
      return false;
    }

    if (start >= end) {
      setBookingError("End date must be after start date");
      return false;
    }

    // Check car availability dates if they exist
    if (car.availabilityFrom && car.availabilityTo) {
      const availableFrom = new Date(car.availabilityFrom);
      const availableTo = new Date(car.availabilityTo);

      if (start < availableFrom || end > availableTo) {
        setBookingError(
          `Selected dates must be between ${availableFrom.toLocaleDateString()} and ${availableTo.toLocaleDateString()}`
        );
        return false;
      }
    }

    return true;
  };

  const handleBook = async (e) => {
    e.preventDefault();

    if (!validateBookingDates()) {
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      const bookingData = {
        carId: car._id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalCost: totalCost,
        numberOfDays: numberOfDays,
        // Add additional fields that your backend might expect
        totalPayable: totalCost,
        totalDays: numberOfDays,
        status: "pending",
      };

      console.log("Submitting booking data:", bookingData);

      const response = await API.post("/bookings", bookingData);

      console.log("Booking response:", response.data);

      navigate("/my-bookings", {
        state: {
          message: "Booking request submitted successfully!",
          bookingId: response.data.data?._id || response.data._id,
        },
      });
    } catch (err) {
      console.error("Booking error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Booking failed. Please try again.";
      setBookingError(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  const nextImage = () => {
    if (car?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
    }
  };

  const prevImage = () => {
    if (car?.images?.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? car.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Car Details - BorrowMyCar</title>
        </Helmet>
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-200 h-64 rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Car Not Found - BorrowMyCar</title>
        </Helmet>
        <div className="max-w-4xl mx-auto p-6">
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
              Error Loading Car
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/browse")}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Browse
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!car) return null;

  // Get the daily rate - handle different field names
  const dailyRate = car.price || car.pricePerDay || car.dailyRate || 0;

  return (
    <>
      <Helmet>
        <title>{car.title} - BorrowMyCar</title>
        <meta name="description" content={car.description} />
      </Helmet>

      <div className="max-w-6xl mx-auto p-6">
        {/* Breadcrumb */}
        <nav className="flex mb-6 text-sm">
          <button
            onClick={() => navigate("/browse")}
            className="text-green-600 hover:text-green-800 font-medium"
          >
            ← Back to Browse
          </button>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-700">{car.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="relative">
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={
                    car.images?.[currentImageIndex] ||
                    "https://via.placeholder.com/800x450?text=No+Image"
                  }
                  alt={`${car.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Image Navigation */}
                {car.images?.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {car.images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              {car.images?.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {car.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-green-500 ring-2 ring-green-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Car Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {car.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
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
                      {car.city}
                    </span>
                    <span className="flex items-center gap-1">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      AED {dailyRate} / day
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {car.description}
                  </p>
                </div>

                {/* Car Specifications */}
                {(car.make ||
                  car.model ||
                  car.year ||
                  car.transmission ||
                  car.fuelType) && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Specifications
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {car.make && (
                        <div>
                          <span className="text-gray-500">Make:</span>
                          <span className="ml-2 font-medium">{car.make}</span>
                        </div>
                      )}
                      {car.model && (
                        <div>
                          <span className="text-gray-500">Model:</span>
                          <span className="ml-2 font-medium">{car.model}</span>
                        </div>
                      )}
                      {car.year && (
                        <div>
                          <span className="text-gray-500">Year:</span>
                          <span className="ml-2 font-medium">{car.year}</span>
                        </div>
                      )}
                      {car.transmission && (
                        <div>
                          <span className="text-gray-500">Transmission:</span>
                          <span className="ml-2 font-medium">
                            {car.transmission}
                          </span>
                        </div>
                      )}
                      {car.fuelType && (
                        <div>
                          <span className="text-gray-500">Fuel Type:</span>
                          <span className="ml-2 font-medium">
                            {car.fuelType}
                          </span>
                        </div>
                      )}
                      {car.seatingCapacity && (
                        <div>
                          <span className="text-gray-500">Seats:</span>
                          <span className="ml-2 font-medium">
                            {car.seatingCapacity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Features */}
                {car.features && car.features.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Features
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {car.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {car.availabilityFrom && car.availabilityTo && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Availability
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
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
                      {new Date(car.availabilityFrom).toLocaleDateString()} -{" "}
                      {new Date(car.availabilityTo).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {user && user.role === "renter" ? (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Book This Car
                  </h2>
                  <form onSubmit={handleBook} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={booking.startDate}
                        onChange={handleBookingChange}
                        min={new Date().toISOString().split("T")[0]}
                        max={car.availabilityTo}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={booking.endDate}
                        onChange={handleBookingChange}
                        min={
                          booking.startDate ||
                          new Date().toISOString().split("T")[0]
                        }
                        max={car.availabilityTo}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                        required
                      />
                    </div>

                    {/* Cost Breakdown */}
                    {numberOfDays > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            AED {dailyRate} × {numberOfDays} day
                            {numberOfDays !== 1 ? "s" : ""}
                          </span>
                          <span>AED {totalCost}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total</span>
                          <span className="text-green-600">
                            AED {totalCost}
                          </span>
                        </div>
                      </div>
                    )}

                    {bookingError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-600">{bookingError}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={bookingLoading || numberOfDays === 0}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                    >
                      {bookingLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        "Confirm Booking"
                      )}
                    </button>
                  </form>
                  <div className="mt-4 text-xs text-gray-500 text-center">
                    🔒 Your booking is secure and protected
                  </div>
                </div>
              ) : user && user.role === "owner" ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-blue-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-blue-800 mb-2">
                      Car Owner View
                    </h3>
                    <p className="text-blue-700">
                      This is your listed car. Switch to a renter account to
                      book cars.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-yellow-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">
                      Login Required
                    </h3>
                    <p className="text-yellow-700 mb-4">
                      Please log in to book this car and enjoy our rental
                      service.
                    </p>
                    <button
                      onClick={() => navigate("/login")}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Login to Book
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CarDetails;
