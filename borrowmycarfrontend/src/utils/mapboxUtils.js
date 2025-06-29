// Frontend Mapbox Utilities for BorrowMyCar
import { MAPBOX_TOKEN } from '../config/mapbox.js';

const MAPBOX_BASE_URL = "https://api.mapbox.com";

// Geocoding - Convert address to coordinates
export const geocodeAddress = async (address) => {
  if (!MAPBOX_TOKEN) {
    // Return demo data for Dubai if no token
    return {
      success: true,
      coordinates: [55.2708, 25.2048],
      place_name: address,
      city: "Dubai",
      country: "United Arab Emirates",
    };
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&country=ae&limit=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        success: true,
        coordinates: feature.center,
        place_name: feature.place_name,
        city: feature.context?.find(c => c.id.includes('place'))?.text || "UAE",
        country: "United Arab Emirates",
      };
    }
    
    return { success: false, error: "Location not found" };
  } catch (error) {
    console.error("Geocoding error:", error);
    return { success: false, error: error.message };
  }
};

// Reverse geocoding - Convert coordinates to address
export const reverseGeocode = async (longitude, latitude) => {
  if (!MAPBOX_TOKEN) {
    return {
      success: true,
      address: "Dubai, UAE",
      city: "Dubai",
      country: "United Arab Emirates",
    };
  }

  try {
    const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&country=ae`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        success: true,
        address: feature.place_name,
        city: feature.context?.find(c => c.id.includes('place'))?.text || "UAE",
        country: "United Arab Emirates",
      };
    }
    
    return { success: false, error: "Address not found" };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return { success: false, error: error.message };
  }
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (point1, point2) => {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;
  
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Get directions between two points
export const getDirections = async (startCoords, endCoords, profile = "driving") => {
  if (!MAPBOX_TOKEN) {
    return {
      success: true,
      distance: calculateDistance(startCoords, endCoords),
      duration: calculateDistance(startCoords, endCoords) * 60, // Rough estimate
      route: [startCoords, endCoords],
    };
  }

  try {
    const [startLon, startLat] = startCoords;
    const [endLon, endLat] = endCoords;
    
    const url = `${MAPBOX_BASE_URL}/directions/v5/mapbox/${profile}/${startLon},${startLat};${endLon},${endLat}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        success: true,
        distance: route.distance / 1000, // Convert to km
        duration: route.duration / 60, // Convert to minutes
        route: route.geometry.coordinates,
        instructions: route.legs[0]?.steps || [],
      };
    }
    
    return { success: false, error: "Route not found" };
  } catch (error) {
    console.error("Directions error:", error);
    return { success: false, error: error.message };
  }
};

// Search for places near a location
export const searchNearby = async (coordinates, query) => {
  if (!MAPBOX_TOKEN) {
    return {
      success: true,
      results: [],
    };
  }

  try {
    const [lon, lat] = coordinates;
    const encodedQuery = encodeURIComponent(query);
    const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}&proximity=${lon},${lat}&country=ae&limit=10`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      success: true,
      results: data.features || [],
    };
  } catch (error) {
    console.error("Search nearby error:", error);
    return { success: false, error: error.message };
  }
};

// Format coordinates for display
export const formatCoordinates = (coordinates) => {
  if (!coordinates || coordinates.length !== 2) return "Invalid coordinates";
  const [lng, lat] = coordinates;
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

// Check if coordinates are within UAE bounds
export const isWithinUAE = (coordinates) => {
  const [lng, lat] = coordinates;
  // UAE bounds: Southwest: [51.5795, 22.4969], Northeast: [56.3968, 26.0693]
  return lng >= 51.5795 && lng <= 56.3968 && lat >= 22.4969 && lat <= 26.0693;
};

// Get closest UAE city to coordinates
export const getClosestCity = (coordinates, cities) => {
  if (!coordinates || !cities) return null;
  
  let closestCity = null;
  let minDistance = Infinity;
  
  cities.forEach(city => {
    const distance = calculateDistance(coordinates, city.coordinates);
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  });
  
  return closestCity;
};

// Extract city from Mapbox context array
export const extractCity = (context) => {
  if (!context || !Array.isArray(context)) return null;
  
  // Look for place context (city)
  const place = context.find(item => item.id && item.id.includes('place'));
  if (place) return place.text;
  
  // Fallback to region
  const region = context.find(item => item.id && item.id.includes('region'));
  if (region) return region.text;
  
  return null;
};

// Create mapbox service object for compatibility
const mapboxService = {
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  getDirections,
  searchNearby,
  formatCoordinates,
  isWithinUAE,
  getClosestCity,
  extractCity,
};

export default mapboxService;