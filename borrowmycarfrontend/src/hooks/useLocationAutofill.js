import { useState, useEffect, useCallback } from "react";
import { mapboxService } from "../utils/mapboxUtils";

export const useLocationAutofill = (options = {}) => {
  const {
    enableGeolocation = true,
    enableRecentLocations = true,
    enableQuickSuggestions = true,
    maxRecentLocations = 5,
    storageKey = "recentLocations",
  } = options;

  const [currentLocation, setCurrentLocation] = useState(null);
  const [recentLocations, setRecentLocations] = useState([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState(null);

  // Load recent locations from localStorage
  useEffect(() => {
    if (!enableRecentLocations) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const locations = JSON.parse(saved);
        setRecentLocations(locations.slice(0, maxRecentLocations));
      }
    } catch (e) {
      console.error("Error loading recent locations:", e);
    }
  }, [enableRecentLocations, storageKey, maxRecentLocations]);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!enableGeolocation || !navigator.geolocation) {
      setError("Geolocation is not supported");
      return null;
    }

    setIsGettingLocation(true);
    setError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000, // 5 minutes cache
          }
        );
      });

      const { longitude, latitude } = position.coords;
      const coordinates = [longitude, latitude];

      // Reverse geocode to get address
      const result = await mapboxService.reverseGeocode(longitude, latitude);

      if (result.success) {
        const locationData = {
          name: result.address,
          coordinates,
          address: result.address,
          city: result.city,
          type: "current_location",
          timestamp: Date.now(),
        };

        setCurrentLocation(locationData);
        return locationData;
      } else {
        throw new Error("Failed to get address for current location");
      }
    } catch (error) {
      console.error("Geolocation error:", error);
      
      let message = "Unable to get your current location.";
      if (error.code === 1) {
        message = "Location access denied. Please enable location services.";
      } else if (error.code === 2) {
        message = "Location unavailable. Please check your connection.";
      } else if (error.code === 3) {
        message = "Location request timeout. Please try again.";
      }
      
      setError(message);
      return null;
    } finally {
      setIsGettingLocation(false);
    }
  }, [enableGeolocation]);

  // Save location to recent locations
  const saveToRecentLocations = useCallback((location) => {
    if (!enableRecentLocations || !location || !location.name) return;

    const newLocation = {
      ...location,
      timestamp: Date.now(),
    };

    setRecentLocations(prev => {
      const filtered = prev.filter(item => item.name !== location.name);
      const updated = [newLocation, ...filtered].slice(0, maxRecentLocations);
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving recent locations:", e);
      }
      
      return updated;
    });
  }, [enableRecentLocations, maxRecentLocations, storageKey]);

  // Search for locations
  const searchLocations = useCallback(async (query) => {
    if (!query || query.length < 2) return [];

    try {
      const result = await mapboxService.searchNearby(
        currentLocation?.coordinates || [55.2708, 25.2048], // Default to Dubai
        query
      );

      if (result.success && result.results) {
        return result.results.map((feature) => ({
          id: feature.id,
          name: feature.place_name,
          text: feature.text,
          coordinates: feature.center,
          city: mapboxService.extractCity(feature.context) || "UAE",
          address: feature.properties?.address || "",
          category: feature.properties?.category || "location",
        }));
      }
      return [];
    } catch (error) {
      console.error("Error searching locations:", error);
      return [];
    }
  }, [currentLocation]);

  // Clear recent locations
  const clearRecentLocations = useCallback(() => {
    setRecentLocations([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Get quick suggestions (popular UAE locations)
  const getQuickSuggestions = useCallback(() => {
    if (!enableQuickSuggestions) return [];

    return [
      { 
        name: "Dubai Mall", 
        city: "Dubai", 
        coordinates: [55.2796, 25.1972],
        type: "mall",
        address: "Downtown Dubai, Dubai"
      },
      { 
        name: "Dubai International Airport", 
        city: "Dubai", 
        coordinates: [55.3644, 25.2532],
        type: "airport",
        address: "Dubai International Airport, Dubai"
      },
      { 
        name: "Burj Khalifa", 
        city: "Dubai", 
        coordinates: [55.2744, 25.1972],
        type: "landmark",
        address: "Downtown Dubai, Dubai"
      },
      { 
        name: "Dubai Marina Mall", 
        city: "Dubai", 
        coordinates: [55.1406, 25.0805],
        type: "mall",
        address: "Dubai Marina, Dubai"
      },
      { 
        name: "Abu Dhabi International Airport", 
        city: "Abu Dhabi", 
        coordinates: [54.6511, 24.4330],
        type: "airport",
        address: "Abu Dhabi International Airport"
      },
      { 
        name: "Dubai Festival City", 
        city: "Dubai", 
        coordinates: [55.3515, 25.2230],
        type: "mall",
        address: "Dubai Festival City, Dubai"
      },
    ];
  }, [enableQuickSuggestions]);

  // Auto-detect and fill current location
  const autoFillCurrentLocation = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location) {
      saveToRecentLocations(location);
    }
    return location;
  }, [getCurrentLocation, saveToRecentLocations]);

  return {
    // State
    currentLocation,
    recentLocations,
    isGettingLocation,
    error,

    // Actions
    getCurrentLocation,
    saveToRecentLocations,
    searchLocations,
    clearRecentLocations,
    getQuickSuggestions,
    autoFillCurrentLocation,

    // Utilities
    isLocationAvailable: !!navigator.geolocation,
  };
};

export default useLocationAutofill;