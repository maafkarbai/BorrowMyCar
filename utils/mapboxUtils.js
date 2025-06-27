// utils/mapboxUtils.js - Backend Mapbox utilities
import dotenv from "dotenv";
dotenv.config();

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const MAPBOX_BASE_URL = "https://api.mapbox.com";

// Geocoding - Convert address to coordinates
export const geocodeAddress = async (address) => {
  if (!MAPBOX_ACCESS_TOKEN) {
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
    const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=ae&limit=1`;
    
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
  if (!MAPBOX_ACCESS_TOKEN) {
    return {
      success: true,
      address: "Dubai, UAE",
      city: "Dubai",
      country: "United Arab Emirates",
    };
  }

  try {
    const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=ae`;
    
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
  if (!MAPBOX_ACCESS_TOKEN) {
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
    
    const url = `${MAPBOX_BASE_URL}/directions/v5/mapbox/${profile}/${startLon},${startLat};${endLon},${endLat}?access_token=${MAPBOX_ACCESS_TOKEN}&geometries=geojson&overview=full`;
    
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
export const searchNearby = async (coordinates, query, radius = 10000) => {
  if (!MAPBOX_ACCESS_TOKEN) {
    return {
      success: true,
      results: [],
    };
  }

  try {
    const [lon, lat] = coordinates;
    const encodedQuery = encodeURIComponent(query);
    const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&proximity=${lon},${lat}&country=ae&limit=10`;
    
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

export default {
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  getDirections,
  searchNearby,
};
