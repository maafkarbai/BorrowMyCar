import React from "react";
import { MapPin, Navigation, Star } from "lucide-react";

const CarCard = ({ car, userLocation = null, showDistance = true }) => {
  const getDistanceText = () => {
    if (!userLocation || !car.location || !showDistance) return null;

    const distance = mapboxService.calculateDistance(
      userLocation.coordinates,
      car.location.coordinates
    );

    return `${distance.toFixed(1)} km away`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={car.images?.[0] || "/placeholder-car.jpg"}
          alt={car.title}
          className="w-full h-48 object-cover"
        />

        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          AED {car.price}/day
        </div>

        {/* Distance Badge */}
        {getDistanceText() && (
          <div className="absolute top-3 left-3 bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Navigation className="w-3 h-3 mr-1" />
            {getDistanceText()}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg mb-1">
          {car.title}
        </h3>

        {car.location && (
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="truncate">{car.location.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 mr-1" />
            <span className="text-sm text-gray-600">
              {car.averageRating || "5.0"} ({car.totalBookings || 0} reviews)
            </span>
          </div>

          <Link
            to={`/cars/${car._id}`}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};
