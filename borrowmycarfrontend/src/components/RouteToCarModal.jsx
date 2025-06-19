import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { X, Navigation, Phone, Clock, MapPin } from "lucide-react";
import { MAPBOX_CONFIG } from "../config/mapbox";
import { mapboxService } from "../utils/mapboxUtils";

const RouteToCarModal = ({ isOpen, onClose, car, userLocation }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userLocation && car?.location) {
      initializeMap();
      getRoute();
    }
  }, [isOpen, userLocation, car]);

  const initializeMap = () => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.style,
      center: userLocation.coordinates,
      zoom: 12,
    });

    // Add markers
    new mapboxgl.Marker({ color: "#3b82f6" })
      .setLngLat(userLocation.coordinates)
      .setPopup(new mapboxgl.Popup().setHTML("<div>Your Location</div>"))
      .addTo(map.current);

    new mapboxgl.Marker({ color: "#16a34a" })
      .setLngLat(car.location.coordinates)
      .setPopup(new mapboxgl.Popup().setHTML(`<div>${car.title}</div>`))
      .addTo(map.current);

    // Fit bounds to show both locations
    const bounds = new mapboxgl.LngLatBounds()
      .extend(userLocation.coordinates)
      .extend(car.location.coordinates);

    map.current.fitBounds(bounds, { padding: 50 });
  };

  const getRoute = async () => {
    setLoading(true);
    try {
      const route = await mapboxService.getDirections(
        userLocation.coordinates,
        car.location.coordinates
      );

      if (route.success) {
        setRouteData(route.route);

        // Add route to map
        map.current.on("load", () => {
          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: route.route.geometry,
            },
          });

          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#16a34a",
              "line-width": 4,
              "line-opacity": 0.8,
            },
          });
        });
      }
    } catch (error) {
      console.error("Error getting route:", error);
    } finally {
      setLoading(false);
    }
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/${userLocation.coordinates[1]},${userLocation.coordinates[0]}/${car.location.coordinates[1]},${car.location.coordinates[0]}`;
    window.open(url, "_blank");
  };

  const openInAppleMaps = () => {
    const url = `http://maps.apple.com/?saddr=${userLocation.coordinates[1]},${userLocation.coordinates[0]}&daddr=${car.location.coordinates[1]},${car.location.coordinates[0]}`;
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Route to Car</h2>
            <p className="text-gray-600">{car.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Map */}
          <div className="lg:w-2/3 h-96 lg:h-[500px]">
            <div ref={mapContainer} className="w-full h-full" />
          </div>

          {/* Route Info */}
          <div className="lg:w-1/3 p-6 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
              </div>
            ) : routeData ? (
              <div className="space-y-6">
                {/* Route Summary */}
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Route Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Distance:</span>
                      <span className="font-medium">
                        {(routeData.distance / 1000).toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {Math.round(routeData.duration / 60)} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Car Info */}
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Destination
                  </h3>
                  <div className="flex items-start space-x-3">
                    <img
                      src={car.images?.[0]}
                      alt={car.title}
                      className="w-16 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{car.title}</h4>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{car.location.name}</span>
                      </div>
                      <p className="text-green-600 font-semibold mt-1">
                        AED {car.price}/day
                      </p>
                    </div>
                  </div>
                </div>

                {/* Owner Contact */}
                {car.owner && (
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Owner Contact
                    </h3>
                    <div className="space-y-2">
                      <p className="font-medium">{car.owner.name}</p>
                      {car.owner.phone && (
                        <a
                          href={`tel:${car.owner.phone}`}
                          className="flex items-center text-blue-600 hover:text-blue-700"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          {car.owner.phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Apps */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    Open in Navigation App
                  </h3>

                  <button
                    onClick={openInGoogleMaps}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Google Maps</span>
                  </button>

                  <button
                    onClick={openInAppleMaps}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Apple Maps</span>
                  </button>
                </div>

                {/* Directions Steps */}
                {routeData.steps && routeData.steps.length > 0 && (
                  <div className="bg-white rounded-lg p-4 max-h-60 overflow-y-auto">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Turn-by-turn Directions
                    </h3>
                    <div className="space-y-2">
                      {routeData.steps.slice(0, 8).map((step, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-2 text-sm"
                        >
                          <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="text-gray-700">
                            {step.maneuver.instruction}
                          </span>
                        </div>
                      ))}
                      {routeData.steps.length > 8 && (
                        <p className="text-xs text-gray-500 mt-2">
                          ... and {routeData.steps.length - 8} more steps
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Unable to calculate route</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteToCarModal;
