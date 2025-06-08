// borrowmycarfrontend/src/utils/mapboxUtils.js - COMPLETE MAPBOX SERVICE
import { MAPBOX_CONFIG } from "../config/mapbox";

export class MapboxService {
  constructor() {
    this.accessToken = MAPBOX_CONFIG.accessToken;
    this.baseUrl = "https://api.mapbox.com";
  }

  // Geocoding: Convert address to coordinates
  async geocodeAddress(address) {
    try {
      if (!address || address.trim().length < 2) {
        return { success: false, error: "Address too short" };
      }

      const response = await fetch(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?` +
          `access_token=${this.accessToken}&` +
          `country=AE&` +
          `bbox=${MAPBOX_CONFIG.uae.bounds.flat().join(",")}&` +
          `limit=5&` +
          `types=address,poi,place`
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        results: data.features.map((feature) => ({
          id: feature.id,
          name: feature.place_name,
          coordinates: feature.center,
          address: feature.properties?.address || "",
          city: this.extractCity(feature.context),
          bbox: feature.bbox,
          relevance: feature.relevance,
        })),
      };
    } catch (error) {
      console.error("Geocoding error:", error);
      return { success: false, error: error.message };
    }
  }

  // Reverse geocoding: Convert coordinates to address
  async reverseGeocode(longitude, latitude) {
    try {
      if (!longitude || !latitude) {
        return { success: false, error: "Invalid coordinates" };
      }

      const response = await fetch(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${longitude},${latitude}.json?` +
          `access_token=${this.accessToken}&` +
          `country=AE&` +
          `types=address,poi,place`
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      const feature = data.features[0];

      if (feature) {
        return {
          success: true,
          result: {
            name: feature.place_name,
            address: feature.properties?.address || "",
            city: this.extractCity(feature.context),
            coordinates: feature.center,
            place_type: feature.place_type?.[0],
          },
        };
      }

      return { success: false, error: "No address found" };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return { success: false, error: error.message };
    }
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(point1, point2) {
    if (!point1 || !point2 || point1.length !== 2 || point2.length !== 2) {
      return 0;
    }

    const [lon1, lat1] = point1;
    const [lon2, lat2] = point2;
    const R = 6371; // Earth's radius in kilometers

    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  // Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Extract city from Mapbox context
  extractCity(context) {
    if (!context || !Array.isArray(context)) return "";

    // Look for place, locality, or region
    const place = context.find(
      (item) =>
        item.id.includes("place") ||
        item.id.includes("locality") ||
        item.id.includes("region")
    );

    return place ? place.text : "";
  }

  // Get directions between two points
  async getDirections(start, end, profile = "driving") {
    try {
      if (!start || !end || start.length !== 2 || end.length !== 2) {
        return { success: false, error: "Invalid coordinates" };
      }

      const response = await fetch(
        `${this.baseUrl}/directions/v5/mapbox/${profile}/${start.join(
          ","
        )};${end.join(",")}?` +
          `access_token=${this.accessToken}&` +
          `geometries=geojson&` +
          `steps=true&` +
          `banner_instructions=true&` +
          `voice_instructions=true`
      );

      if (!response.ok) {
        throw new Error(`Directions failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          success: true,
          route: {
            geometry: route.geometry,
            distance: route.distance, // meters
            duration: route.duration, // seconds
            steps: route.legs[0]?.steps || [],
            summary: {
              distance: this.formatDistance(route.distance / 1000), // km
              duration: this.formatDuration(route.duration / 60), // minutes
            },
          },
        };
      }

      return { success: false, error: "No route found" };
    } catch (error) {
      console.error("Directions error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get matrix of distances/durations between multiple points
  async getMatrix(coordinates, profile = "driving") {
    try {
      if (!coordinates || coordinates.length < 2) {
        return { success: false, error: "Need at least 2 coordinates" };
      }

      const coordString = coordinates.map((coord) => coord.join(",")).join(";");

      const response = await fetch(
        `${this.baseUrl}/directions-matrix/v1/mapbox/${profile}/${coordString}?` +
          `access_token=${this.accessToken}&` +
          `annotations=distance,duration`
      );

      if (!response.ok) {
        throw new Error(`Matrix failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        durations: data.durations,
        distances: data.distances,
        destinations: data.destinations,
        sources: data.sources,
      };
    } catch (error) {
      console.error("Matrix error:", error);
      return { success: false, error: error.message };
    }
  }

  // Check if coordinates are within UAE bounds
  isWithinUAE(coordinates) {
    if (!coordinates || coordinates.length !== 2) return false;

    const [lng, lat] = coordinates;
    const bounds = MAPBOX_CONFIG.uae.bounds;

    return (
      lng >= bounds[0][0] &&
      lng <= bounds[1][0] &&
      lat >= bounds[0][1] &&
      lat <= bounds[1][1]
    );
  }

  // Find nearest UAE city to given coordinates
  findNearestCity(coordinates) {
    if (!coordinates || coordinates.length !== 2) return null;

    let nearestCity = null;
    let shortestDistance = Infinity;

    MAPBOX_CONFIG.uae.cities.forEach((city) => {
      const distance = this.calculateDistance(coordinates, city.coordinates);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestCity = { ...city, distance };
      }
    });

    return nearestCity;
  }

  // Format distance for display
  formatDistance(kilometers) {
    if (kilometers < 1) {
      return `${Math.round(kilometers * 1000)}m`;
    }
    return `${kilometers.toFixed(1)}km`;
  }

  // Format duration for display
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${Math.round(minutes)}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  }

  // Get current user location
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates = [
            position.coords.longitude,
            position.coords.latitude,
          ];

          resolve({
            coordinates,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            isWithinUAE: this.isWithinUAE(coordinates),
            nearestCity: this.findNearestCity(coordinates),
          });
        },
        (error) => {
          let message = "Failed to get location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information unavailable";
              break;
            case error.TIMEOUT:
              message = "Location request timed out";
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  // Search for places within UAE
  async searchPlaces(query, options = {}) {
    try {
      const {
        types = "poi,address,place",
        proximity = MAPBOX_CONFIG.center,
        limit = 10,
      } = options;

      const response = await fetch(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?` +
          `access_token=${this.accessToken}&` +
          `country=AE&` +
          `types=${types}&` +
          `proximity=${proximity.join(",")}&` +
          `limit=${limit}&` +
          `bbox=${MAPBOX_CONFIG.uae.bounds.flat().join(",")}`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        places: data.features.map((feature) => ({
          id: feature.id,
          name: feature.place_name,
          coordinates: feature.center,
          category: feature.properties?.category,
          address: feature.properties?.address,
          city: this.extractCity(feature.context),
          type: feature.place_type?.[0],
          relevance: feature.relevance,
        })),
      };
    } catch (error) {
      console.error("Places search error:", error);
      return { success: false, error: error.message };
    }
  }

  // Validate Mapbox access token
  async validateToken() {
    try {
      const response = await fetch(
        `${this.baseUrl}/geocoding/v5/mapbox.places/dubai.json?access_token=${this.accessToken}&limit=1`
      );

      return {
        valid: response.ok,
        status: response.status,
        message: response.ok ? "Token is valid" : "Token is invalid",
      };
    } catch (error) {
      return {
        valid: false,
        status: 0,
        message: `Token validation failed: ${error.message}`,
      };
    }
  }

  // Create a static map URL
  createStaticMapUrl(options = {}) {
    const {
      coordinates = MAPBOX_CONFIG.center,
      zoom = 12,
      width = 600,
      height = 400,
      style = "streets-v12",
      markers = [],
    } = options;

    let url = `${this.baseUrl}/styles/v1/mapbox/${style}/static`;

    // Add markers
    if (markers.length > 0) {
      const markerString = markers
        .map((marker) => {
          const { coordinates: coords, color = "red", size = "m" } = marker;
          return `pin-${size}-${color}(${coords.join(",")})`;
        })
        .join(",");
      url += `/${markerString}`;
    }

    // Add center and zoom
    url += `/${coordinates.join(",")},${zoom}`;

    // Add dimensions
    url += `/${width}x${height}`;

    // Add access token
    url += `?access_token=${this.accessToken}`;

    return url;
  }
}

// Create singleton instance
export const mapboxService = new MapboxService();

// Export utility functions
export const {
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  getDirections,
  getCurrentLocation,
  searchPlaces,
  isWithinUAE,
  findNearestCity,
  formatDistance,
  formatDuration,
} = mapboxService;
