// borrowmycarfrontend/src/utils/mapboxService.js - DEMO VERSION
export class MapboxService {
  constructor() {
    this.demoMode = !import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  }

  // Mock geocoding for demo
  async geocodeAddress(address) {
    if (this.demoMode) {
      return {
        success: true,
        results: [
          {
            id: "demo_1",
            name: address,
            coordinates: [55.2708, 25.2048], // Dubai coordinates
            city: "Dubai",
          },
        ],
      };
    }
    // Real implementation here
  }

  // Calculate distance (works without API)
  calculateDistance(point1, point2) {
    const [lon1, lat1] = point1;
    const [lon2, lat2] = point2;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Other methods with demo fallbacks...
}

export const mapboxService = new MapboxService();
