import { useState, useCallback } from "react";
import { mapboxService } from "../utils/mapboxUtils";
import API from "../api";

export const useLocationSearch = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const searchNearLocation = useCallback(
    async (location, radius = 10, filters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          location: location.coordinates.join(","),
          radius: radius,
          ...filters,
        };

        const response = await API.get("/cars", { params });

        if (response.data.success) {
          // Calculate distances for each car
          const carsWithDistance = await Promise.all(
            response.data.data.cars.map(async (car) => {
              if (car.location && car.location.coordinates) {
                const distance = mapboxService.calculateDistance(
                  location.coordinates,
                  car.location.coordinates
                );
                return { ...car, distance: distance.toFixed(1) };
              }
              return car;
            })
          );

          // Sort by distance
          carsWithDistance.sort(
            (a, b) => parseFloat(a.distance) - parseFloat(b.distance)
          );

          setResults(carsWithDistance);
        }
      } catch (err) {
        setError(err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const searchInBounds = useCallback(async (bounds, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        bounds: [
          bounds.getSouthWest().lng,
          bounds.getSouthWest().lat,
          bounds.getNorthEast().lng,
          bounds.getNorthEast().lat,
        ].join(","),
        ...filters,
      };

      const response = await API.get("/cars", { params });

      if (response.data.success) {
        setResults(response.data.data.cars);
      }
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    loading,
    results,
    error,
    searchNearLocation,
    searchInBounds,
    clearResults,
  };
};
