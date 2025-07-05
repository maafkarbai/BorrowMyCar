import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Navigation, Star, Phone } from "lucide-react";
import UserAvatar from "./UserAvatar";

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
      aria-label={`Rent ${car.title}`}
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

        {/* Owner Information Section */}
        <div className="border-t border-gray-100 pt-3 mt-3">
          <div className="flex items-center justify-between">
            <Link 
              to={`/users/${car.owner?._id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2 -ml-2 transition-colors"
            >
              <UserAvatar 
                user={car.owner} 
                size="md"
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {car.owner?.name || 'Owner'}
                </p>
                <div className="flex items-center space-x-2">
                  {car.owner?.averageRating && (
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-600 ml-1">
                        {car.owner.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
            
            {/* Contact Button */}
            {car.owner?.phone && (
              <a 
                href={`tel:${car.owner.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
                title={`Call ${car.owner.name}`}
              >
                <Phone className="w-3 h-3" />
                <span>Call</span>
              </a>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-3">
          <div>
            <span className="text-xl font-bold text-gray-900">
              AED {car.price || car.pricePerDay}
            </span>
            <span className="text-sm text-gray-500 block">per day</span>
          </div>
          <button 
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isUnavailable 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={isUnavailable}
            onClick={(e) => {
              if (isUnavailable) {
                e.preventDefault();
              }
            }}
          >
            {isUnavailable ? 'Unavailable' : 'Rent Now'}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default CarCard;