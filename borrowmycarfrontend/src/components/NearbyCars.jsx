import React, { useState, useEffect } from "react";
import { MapPin, Navigation, Car } from "lucide-react";
import { mapboxService } from "../utils/mapboxUtils";
import API from "../api";

const NearbyCars = ({
  userLocation,
  radius = 10,
  excludeCarId = null,
  limit = 6,
  className = "",
}) => {
  const [nearbyCars, setNearbyCars] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyCars();
    }
  }, [userLocation, radius]);

  const fetchNearbyCars = async () => {
    setLoading(true);
    try {
      const response = await API.get("/cars", {
        params: {
          location: userLocation.coordinates.join(","),
          radius: radius,
          limit: limit,
          exclude: excludeCarId,
        },
      });

      if (response.data.success) {
        const carsWithDistance = await Promise.all(
          response.data.data.cars.map(async (car) => {
            if (car.location && car.location.coordinates) {
              const distance = mapboxService.calculateDistance(
                userLocation.coordinates,
                car.location.coordinates
              );
              return { ...car, distance: distance.toFixed(1) };
            }
            return car;
          })
        );

        // Sort by distance
        carsWithDistance.sort(
          (a, b) => parseFloat(a.distance) - parseFloat(b.distance)
        );
        setNearbyCars(carsWithDistance);
      }
    } catch (error) {
      console.error("Error fetching nearby cars:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!userLocation) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Cars Near You</h3>
        <span className="text-sm text-gray-500">Within {radius} km</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-40 rounded-lg mb-2"></div>
              <div className="bg-gray-200 h-4 rounded mb-1"></div>
              <div className="bg-gray-200 h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : nearbyCars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nearbyCars.map((car) => (
            <div
              key={car._id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative">
                <img
                  src={car.images?.[0] || "/placeholder-car.jpg"}
                  alt={car.title}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                  <Navigation className="w-3 h-3 mr-1" />
                  {car.distance} km
                </div>
              </div>

              <div className="p-3">
                <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">
                  {car.title}
                </h4>

                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span className="line-clamp-1">{car.location?.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-green-600 font-semibold">
                    AED {car.price}/day
                  </span>
                  <button
                    onClick={() => (window.location.href = `/cars/${car._id}`)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No cars found within {radius} km</p>
          <button
            onClick={() => fetchNearbyCars()}
            className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
          >
            Expand search area
          </button>
        </div>
      )}
    </div>
  );
};

export default NearbyCars;
