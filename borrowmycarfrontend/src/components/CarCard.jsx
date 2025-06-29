import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Navigation, Star } from "lucide-react";

const CarCard = ({ car, userLocation = null, showDistance = true }) => {
  const getDistanceText = () => {
    if (!userLocation || !car.location || !showDistance) return null;
    return `5.2 km away`;
  };

  const isUnavailable = car.status !== 'active';

  return (
    <Link 
      to={`/cars/${car._id}`}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow w-full text-left block"
      aria-label={`View details for ${car.title}`}
    >
      <div className="relative">
        <img
          src={car.images?.[0] || '/default-car.jpg'}
          alt={car.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.src = '/default-car.jpg';
          }}
        />
        {isUnavailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Unavailable</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
            {car.title}
          </h3>
          <div className="flex items-center ml-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600 ml-1">
              {car.rating || '4.5'}
            </span>
          </div>
        </div>

        <div className="flex items-center text-gray-600 text-sm mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{car.city}</span>
          {getDistanceText() && (
            <>
              <Navigation className="w-4 h-4 ml-3 mr-1" />
              <span>{getDistanceText()}</span>
            </>
          )}
        </div>

        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-gray-600">
            <span>{car.year} • {car.transmission} • {car.fuelType}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {car.owner?.name || 'Owner'}
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-gray-900">
              AED {car.price || car.pricePerDay}
            </span>
            <span className="text-sm text-gray-500 block">per day</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CarCard;