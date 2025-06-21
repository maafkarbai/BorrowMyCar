// borrowmycarfrontend/src/components/MapBox/CarLocationMap.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BaseMap from "./BaseMap";
import { UAE_CITIES } from "../../config/mapbox";
import { MapPin, Car, DollarSign, Calendar } from "lucide-react";

const CarLocationMap = ({
  cars = [],
  selectedCarId = null,
  onCarSelect,
  showFilters = true,
  className = "w-full h-96",
}) => {
  const navigate = useNavigate();
  const [filteredCars, setFilteredCars] = useState(cars);
  const [selectedCity, setSelectedCity] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

  useEffect(() => {
    let filtered = cars;

    // Filter by city
    if (selectedCity !== "all") {
      filtered = filtered.filter((car) => car.city === selectedCity);
    }

    // Filter by price range
    filtered = filtered.filter(
      (car) => car.price >= priceRange.min && car.price <= priceRange.max
    );

    setFilteredCars(filtered);
  }, [cars, selectedCity, priceRange]);

  // Convert cars to map markers
  const carMarkers = filteredCars.map((car) => {
    const cityCoords = UAE_CITIES[car.city] || {
      latitude: 25.2048,
      longitude: 55.2708,
    };

    return {
      id: car._id,
      longitude:
        car.longitude || cityCoords.longitude + (Math.random() - 0.5) * 0.1,
      latitude:
        car.latitude || cityCoords.latitude + (Math.random() - 0.5) * 0.1,
      title: car.title,
      description: `${car.make} ${car.model} ${car.year}`,
      price: car.price || car.pricePerDay,
      address: car.city,
      car: car,
      icon: (
        <div
          className={`w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all ${
            selectedCarId === car._id
              ? "bg-green-600 scale-125"
              : "bg-blue-600 hover:bg-green-600"
          }`}
        >
          <Car className="w-5 h-5 text-white" />
        </div>
      ),
    };
  });

  const handleMarkerClick = (marker) => {
    if (onCarSelect) {
      onCarSelect(marker.car);
    }
  };

  const handleCarView = (car) => {
    navigate(`/cars/${car._id}`);
  };

  // Calculate center based on filtered cars
  const mapCenter =
    filteredCars.length > 0
      ? {
          latitude:
            filteredCars.reduce((sum, car) => {
              const cityCoords = UAE_CITIES[car.city] || UAE_CITIES["Dubai"];
              return sum + cityCoords.latitude;
            }, 0) / filteredCars.length,
          longitude:
            filteredCars.reduce((sum, car) => {
              const cityCoords = UAE_CITIES[car.city] || UAE_CITIES["Dubai"];
              return sum + cityCoords.longitude;
            }, 0) / filteredCars.length,
          zoom: selectedCity !== "all" ? 11 : 8,
        }
      : UAE_CITIES["Dubai"];

  return (
    <div className="space-y-4">
      {/* Map Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Cities</option>
              {Object.keys(UAE_CITIES).map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min="50"
              max="500"
              value={priceRange.max}
              onChange={(e) =>
                setPriceRange((prev) => ({
                  ...prev,
                  max: parseInt(e.target.value),
                }))
              }
              className="w-24"
            />
            <span className="text-sm text-gray-600">
              Up to AED {priceRange.max}/day
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Car className="w-4 h-4" />
            <span>{filteredCars.length} cars available</span>
          </div>
        </div>
      )}

      {/* Map */}
      <BaseMap
        className={className}
        markers={carMarkers}
        selectedMarker={carMarkers.find((m) => m.id === selectedCarId)}
        onMarkerClick={handleMarkerClick}
        initialViewState={mapCenter}
      >
        {/* Custom Popup Content */}
        {selectedCarId && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
            {(() => {
              const selectedCar = cars.find((car) => car._id === selectedCarId);
              if (!selectedCar) return null;

              return (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={selectedCar.images?.[0] || "/placeholder-car.jpg"}
                      alt={selectedCar.title}
                      className="w-16 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {selectedCar.title}
                      </h3>
                      <p className="text-gray-600 text-xs">
                        {selectedCar.make} {selectedCar.model}{" "}
                        {selectedCar.year}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-green-600 font-semibold text-sm">
                          AED {selectedCar.price || selectedCar.pricePerDay}/day
                        </span>
                        <span className="text-gray-500 text-xs">
                          📍 {selectedCar.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCarView(selectedCar)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onCarSelect && onCarSelect(null)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </BaseMap>

      {/* Map Legend */}
      <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
          <span>Available Cars</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded-full"></div>
          <span>Selected Car</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>Click markers for details</span>
        </div>
      </div>
    </div>
  );
};

export default CarLocationMap;
