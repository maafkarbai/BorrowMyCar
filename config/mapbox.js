// borrowmycarfrontend/src/config/mapbox.js - COMPLETE MAPBOX CONFIGURATION
import mapboxgl from "mapbox-gl";

// Get Mapbox access token from environment variables
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Validate token exists
if (!MAPBOX_TOKEN) {
  console.warn(
    "⚠️ Mapbox access token not found. Please set VITE_MAPBOX_ACCESS_TOKEN in your .env file"
  );
  console.log(
    "Example: VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6InlvdXJhY2Nlc3N0b2tlbiJ9..."
  );
}

// Set the access token globally for Mapbox GL JS
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

// UAE geographic bounds [Southwest, Northeast]
export const UAE_BOUNDS = [
  [51.5795, 22.4969], // Southwest coordinates [lng, lat]
  [56.3968, 26.0693], // Northeast coordinates [lng, lat]
];

// UAE center coordinates (Dubai)
export const UAE_CENTER = [55.2708, 25.2048]; // [lng, lat]

// Major UAE cities with coordinates
export const UAE_CITIES = [
  { name: "Dubai", coordinates: [55.2708, 25.2048] },
  { name: "Abu Dhabi", coordinates: [54.3773, 24.4539] },
  { name: "Sharjah", coordinates: [55.3881, 25.3573] },
  { name: "Ajman", coordinates: [55.5136, 25.4052] },
  { name: "Fujairah", coordinates: [56.3269, 25.1288] },
  { name: "Ras Al Khaimah", coordinates: [55.9432, 25.7895] },
  { name: "Umm Al Quwain", coordinates: [55.7558, 25.5641] },
  { name: "Al Ain", coordinates: [55.7581, 24.2075] },
  // Additional popular areas
  { name: "Dubai Marina", coordinates: [55.1406, 25.0805] },
  { name: "Downtown Dubai", coordinates: [55.2744, 25.1972] },
  { name: "Jumeirah", coordinates: [55.2324, 25.2285] },
  { name: "Business Bay", coordinates: [55.2736, 25.1898] },
  { name: "DIFC", coordinates: [55.2708, 25.2137] },
  { name: "Dubai South", coordinates: [55.1644, 24.8958] },
  { name: "JLT", coordinates: [55.1441, 25.0693] },
];

// Available map styles
export const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-v9",
  "satellite-streets": "mapbox://styles/mapbox/satellite-streets-v12",
  navigation: "mapbox://styles/mapbox/navigation-day-v1",
  "navigation-night": "mapbox://styles/mapbox/navigation-night-v1",
};

// Main Mapbox configuration object
export const MAPBOX_CONFIG = {
  // Access token
  accessToken: MAPBOX_TOKEN,

  // Default map settings
  style: MAP_STYLES.streets,
  center: UAE_CENTER,
  zoom: 10,
  minZoom: 6,
  maxZoom: 18,

  // UAE-specific bounds and cities
  uae: {
    bounds: UAE_BOUNDS,
    center: UAE_CENTER,
    cities: UAE_CITIES,
  },

  // Map control settings
  controls: {
    navigation: true,
    fullscreen: true,
    geolocate: true,
    scale: true,
  },

  // Clustering settings for multiple markers
  clustering: {
    enabled: true,
    maxZoom: 14,
    radius: 50,
    clusterProperties: {
      sum: ["+", ["get", "point_count"]],
    },
  },

  // Popup settings
  popup: {
    closeButton: true,
    closeOnClick: false,
    closeOnMove: false,
    offset: [0, -10],
    className: "custom-popup",
  },

  // Marker settings
  marker: {
    color: "#16a34a", // Green color matching your brand
    size: "medium",
    draggable: false,
  },

  // Geocoding settings
  geocoding: {
    country: "ae",
    bbox: [...UAE_BOUNDS[0], ...UAE_BOUNDS[1]],
    types: "address,poi,place",
    language: "en",
    limit: 5,
  },

  // Directions settings
  directions: {
    profile: "driving", // driving, walking, cycling
    alternatives: true,
    steps: true,
    geometries: "geojson",
    annotations: ["duration", "distance"],
  },

  // Animation settings
  animation: {
    duration: 1000,
    easing: "easeInOutCubic",
  },
};

// Geocoding configuration for search
export const GEOCODING_CONFIG = {
  accessToken: MAPBOX_TOKEN,
  country: "ae",
  bbox: [...UAE_BOUNDS[0], ...UAE_BOUNDS[1]],
  types: "address,poi,place",
  language: "en",
  proximity: UAE_CENTER,
  autocomplete: true,
  fuzzyMatch: true,
  routing: false,
};

// Map themes for different contexts
export const MAP_THEMES = {
  default: {
    style: MAP_STYLES.streets,
    zoom: 10,
    pitch: 0,
    bearing: 0,
  },
  satellite: {
    style: MAP_STYLES["satellite-streets"],
    zoom: 12,
    pitch: 45,
    bearing: 0,
  },
  navigation: {
    style: MAP_STYLES.navigation,
    zoom: 15,
    pitch: 60,
    bearing: 0,
  },
  dark: {
    style: MAP_STYLES.dark,
    zoom: 10,
    pitch: 0,
    bearing: 0,
  },
};

// Car marker icon configurations
export const CAR_MARKER_CONFIGS = {
  available: {
    color: "#16a34a", // Green
    symbol: "car",
    size: "large",
  },
  booked: {
    color: "#dc2626", // Red
    symbol: "car",
    size: "large",
  },
  pending: {
    color: "#f59e0b", // Yellow/Orange
    symbol: "car",
    size: "large",
  },
};

// User location marker configuration
export const USER_MARKER_CONFIG = {
  color: "#3b82f6", // Blue
  symbol: "marker",
  size: "large",
  pulsing: true,
};

// Utility function to validate configuration
export const validateMapboxConfig = () => {
  const issues = [];

  if (!MAPBOX_TOKEN) {
    issues.push("Missing Mapbox access token (VITE_MAPBOX_ACCESS_TOKEN)");
  }

  if (!mapboxgl.supported()) {
    issues.push("WebGL is not supported in this browser");
  }

  return {
    valid: issues.length === 0,
    issues,
    token: MAPBOX_TOKEN ? "✓ Present" : "✗ Missing",
    webgl: mapboxgl.supported() ? "✓ Supported" : "✗ Not supported",
  };
};

// Utility function to get map style by name
export const getMapStyle = (styleName) => {
  return MAP_STYLES[styleName] || MAP_STYLES.streets;
};

// Utility function to get UAE city by name
export const getUAECity = (cityName) => {
  return UAE_CITIES.find(
    (city) => city.name.toLowerCase() === cityName.toLowerCase()
  );
};

// Export the Mapbox token for external use
export { MAPBOX_TOKEN };

// Export mapboxgl instance
export default mapboxgl;
