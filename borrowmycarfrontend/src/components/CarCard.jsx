import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Navigation, Star } from "lucide-react";

const CarCard = ({ car, userLocation = null, showDistance = true }) => {
  const getDistanceText = () => {
    if (!userLocation || !car.location || !showDistance) return null;

    // Placeholder distance calculation
    return `5.2 km away`;
  };

  const isUnavailable = car.status !== 'active';

  return (
    <button 
      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow w-full text-left"
      aria-label="View details"
    >
      <div className="relative">
        <img
          src={car.images?.[0] || "/placeholder-car.jpg"}
          alt={car.title}
          className="w-full h-48 object-cover"
        />

        {/* Status overlay for unavailable cars */}
        {isUnavailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Unavailable</span>
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          AED {car.pricePerDay || car.price}/day
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
        <h3 className="font-semibold text-gray-900 text-lg mb-2">
          {car.title}
        </h3>

        {/* Car details */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{car.make}</span>
            <span>{car.year}</span>
            <span>{car.transmission}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{car.fuelType}</span>
            <span>{car.seatingCapacity} seats</span>
          </div>
        </div>

        {/* Location */}
        {(car.city || car.location) && (
          <div className="flex items-center text-gray-600 text-sm mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="truncate">{car.city || car.location?.name}</span>
          </div>
        )}

        {/* Owner and rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 mr-1" />
            {car.owner ? (
              <div className="text-sm text-gray-600">
                <span>{car.owner.averageRating || "5.0"}</span>
                <span className="ml-2">{car.owner.name}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-600">5.0</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
