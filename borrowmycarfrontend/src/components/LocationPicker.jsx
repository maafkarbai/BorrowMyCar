import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { MapPin, Navigation, Search, X } from "lucide-react";
import { MAPBOX_CONFIG } from "../config/mapbox";
import { mapboxService } from "../utils/mapboxUtils";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

const LocationPicker = ({
  onLocationSelect,
  initialLocation = null,
  placeholder = "Search for a location in UAE...",
  showCurrentLocation = true,
  className = "",
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const geocoder = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [showMap, setShowMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!showMap || !mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.style,
      center: initialLocation?.coordinates || MAPBOX_CONFIG.center,
      zoom: MAPBOX_CONFIG.zoom,
      maxBounds: MAPBOX_CONFIG.uae.bounds,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Initialize geocoder
    geocoder.current = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      countries: "ae",
      bbox: MAPBOX_CONFIG.uae.bounds.flat(),
      placeholder: "Search UAE locations...",
      proximity: MAPBOX_CONFIG.center,
    });

    map.current.addControl(geocoder.current, "top-left");

    // Handle geocoder results
    geocoder.current.on("result", (e) => {
      const { result } = e;
      const location = {
        name: result.place_name,
        coordinates: result.center,
        address: result.properties.address || "",
        city: mapboxService.extractCity(result.context),
      };

      setSelectedLocation(location);
      onLocationSelect(location);
      addMarker(result.center);
    });

    // Handle map clicks
    map.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      setIsLoading(true);

      const reverseResult = await mapboxService.reverseGeocode(lng, lat);

      if (reverseResult.success) {
        setSelectedLocation(reverseResult.result);
        onLocationSelect(reverseResult.result);
        addMarker([lng, lat]);
      }

      setIsLoading(false);
    });

    // Add initial marker if location provided
    if (initialLocation?.coordinates) {
      addMarker(initialLocation.coordinates);
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [showMap]);

  const addMarker = (coordinates) => {
    if (marker.current) {
      marker.current.remove();
    }

    marker.current = new mapboxgl.Marker({
      color: "#16a34a",
      draggable: true,
    })
      .setLngLat(coordinates)
      .addTo(map.current);

    // Handle marker drag
    marker.current.on("dragend", async () => {
      const lngLat = marker.current.getLngLat();
      setIsLoading(true);

      const reverseResult = await mapboxService.reverseGeocode(
        lngLat.lng,
        lngLat.lat
      );

      if (reverseResult.success) {
        setSelectedLocation(reverseResult.result);
        onLocationSelect(reverseResult.result);
      }

      setIsLoading(false);
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;
        setCurrentLocation([longitude, latitude]);

        const reverseResult = await mapboxService.reverseGeocode(
          longitude,
          latitude
        );

        if (reverseResult.success) {
          const locationData = {
            name: reverseResult.address,
            coordinates: [longitude, latitude],
            address: reverseResult.address,
            city: reverseResult.city,
            type: "current_location"
          };

          setSelectedLocation(locationData);
          onLocationSelect(locationData);

          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 15,
            });
            addMarker([longitude, latitude]);
          }

          // Auto-fill any visible text inputs with the location
          autoFillLocationInputs(locationData);
        }

        setIsLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLoading(false);
        
        let message = "Unable to get your current location.";
        if (error.code === 1) {
          message = "Location access denied. Please enable location services and try again.";
        } else if (error.code === 2) {
          message = "Location unavailable. Please check your internet connection and try again.";
        } else if (error.code === 3) {
          message = "Location request timeout. Please try again.";
        }
        
        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  };

  const autoFillLocationInputs = (locationData) => {
    // Trigger a custom event that other components can listen to
    const event = new CustomEvent('locationAutofill', {
      detail: {
        location: locationData,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
  };

  const clearSelection = () => {
    setSelectedLocation(null);
    onLocationSelect(null);
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
    if (geocoder.current) {
      geocoder.current.clear();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Display */}
      <div className="relative">
        <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg bg-white">
          <MapPin className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            {selectedLocation ? (
              <div>
                <p className="font-medium text-gray-900">
                  {selectedLocation.name}
                </p>
                {selectedLocation.city && (
                  <p className="text-sm text-gray-600">
                    {selectedLocation.city}, UAE
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">{placeholder}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {showCurrentLocation && (
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isLoading}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                title="Auto-fill current location"
              >
                {isLoading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Open map"
            >
              <Search className="w-4 h-4" />
            </button>

            {selectedLocation && (
              <button
                type="button"
                onClick={clearSelection}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
            <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Map Container */}
      {showMap && (
        <div className="relative">
          <div
            ref={mapContainer}
            className="h-96 w-full rounded-lg border border-gray-300"
          />

          <button
            onClick={() => setShowMap(false)}
            className="absolute top-2 right-2 bg-white hover:bg-gray-50 border border-gray-300 p-2 rounded-lg shadow-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-2 left-2 bg-white p-2 rounded-lg shadow-lg text-xs text-gray-600">
            Click on the map or drag the marker to select a location
          </div>
        </div>
      )}

      {/* Quick Location Buttons */}
      <div className="flex flex-wrap gap-2">
        {MAPBOX_CONFIG.uae.cities.map((city) => (
          <button
            key={city.name}
            type="button"
            onClick={async () => {
              setIsLoading(true);
              const reverseResult = await mapboxService.reverseGeocode(
                city.coordinates[0],
                city.coordinates[1]
              );

              if (reverseResult.success) {
                setSelectedLocation({
                  ...reverseResult.result,
                  name: city.name,
                  city: city.name,
                });
                onLocationSelect({
                  ...reverseResult.result,
                  name: city.name,
                  city: city.name,
                });

                if (map.current && showMap) {
                  map.current.flyTo({
                    center: city.coordinates,
                    zoom: 12,
                  });
                  addMarker(city.coordinates);
                }
              }
              setIsLoading(false);
            }}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 rounded-full transition-colors"
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LocationPicker;
