// borrowmycarfrontend/src/components/MapBox/BaseMap.jsx
import React, { useRef, useState } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl";
import { DEFAULT_MAP_CONFIG, MAPBOX_CONFIG } from "../../config/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const BaseMap = ({
  children,
  onMapClick,
  showUserLocation = true,
  showNavigation = true,
  markers = [],
  selectedMarker = null,
  onMarkerClick,
  className = "w-full h-96",
  initialViewState,
  ...props
}) => {
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    ...DEFAULT_MAP_CONFIG,
    ...initialViewState,
  });
  const [showPopup, setShowPopup] = useState(null);

  const handleMapClick = (event) => {
    const { lng, lat } = event.lngLat;
    if (onMapClick) {
      onMapClick({ longitude: lng, latitude: lat });
    }
  };

  const handleMarkerClick = (marker, index) => {
    setShowPopup(marker);
    if (onMarkerClick) {
      onMarkerClick(marker, index);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={MAPBOX_CONFIG.style}
        mapboxAccessToken={MAPBOX_CONFIG.accessToken}
        maxBounds={MAPBOX_CONFIG.uae.bounds}
        attributionControl={false}
        {...props}
      >
        {/* Navigation Controls */}
        {showNavigation && <NavigationControl position="top-right" />}

        {/* User Location Control */}
        {showUserLocation && (
          <GeolocateControl
            position="top-right"
            trackUserLocation={true}
            showUserHeading={true}
          />
        )}

        {/* Custom Markers */}
        {markers.map((marker, index) => (
          <Marker
            key={marker.id || index}
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="bottom"
            onClick={() => handleMarkerClick(marker, index)}
          >
            <div
              className={`cursor-pointer transform transition-transform hover:scale-110 ${
                selectedMarker?.id === marker.id ? "scale-125" : ""
              }`}
            >
              {marker.icon || (
                <div className="w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🚗</span>
                </div>
              )}
            </div>
          </Marker>
        ))}

        {/* Popup for selected marker */}
        {showPopup && (
          <Popup
            longitude={showPopup.longitude}
            latitude={showPopup.latitude}
            anchor="bottom"
            onClose={() => setShowPopup(null)}
            closeButton={true}
            closeOnClick={false}
            className="map-popup"
          >
            <div className="p-2 min-w-48">
              {showPopup.title && (
                <h3 className="font-semibold text-gray-900 mb-1">
                  {showPopup.title}
                </h3>
              )}
              {showPopup.description && (
                <p className="text-gray-600 text-sm mb-2">
                  {showPopup.description}
                </p>
              )}
              {showPopup.price && (
                <p className="text-green-600 font-semibold">
                  AED {showPopup.price}/day
                </p>
              )}
              {showPopup.address && (
                <p className="text-gray-500 text-xs mt-1">
                  📍 {showPopup.address}
                </p>
              )}
            </div>
          </Popup>
        )}

        {/* Children components (additional layers, controls, etc.) */}
        {children}
      </Map>
    </div>
  );
};

export default BaseMap;
