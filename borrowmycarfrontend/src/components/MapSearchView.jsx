import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import {
  Search,
  Filter,
  List,
  Map as MapIcon,
  Car,
  DollarSign,
} from "lucide-react";
import { MAPBOX_CONFIG } from "../config/mapbox";
import { mapboxService } from "../utils/mapboxUtils";
import API from "../api";

const MapSearchView = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("map"); // 'map' or 'list'
  const [filters, setFilters] = useState({
    priceMin: "",
    priceMax: "",
    category: "",
    transmission: "",
  });
  const [mapBounds, setMapBounds] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const markersRef = useRef([]);

  useEffect(() => {
    initializeMap();
    fetchCars();
  }, []);

  useEffect(() => {
    if (cars.length > 0) {
      updateMapMarkers();
    }
  }, [filteredCars]);

  const initializeMap = () => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.style,
      center: MAPBOX_CONFIG.center,
      zoom: MAPBOX_CONFIG.zoom,
      maxBounds: MAPBOX_CONFIG.uae.bounds,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Listen for map movement to update search area
    map.current.on("moveend", () => {
      const bounds = map.current.getBounds();
      setMapBounds(bounds);
      searchCarsInArea(bounds);
    });

    map.current.on("load", () => {
      // Add clusters for better performance
      map.current.addSource("cars", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circles
      map.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "cars",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#51bbd6",
            10,
            "#f1f075",
            30,
            "#f28cb1",
          ],
          "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 30, 40],
        },
      });

      // Cluster count labels
      map.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "cars",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
      });

      // Individual car points
      map.current.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "cars",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#16a34a",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      // Click events
      map.current.on("click", "clusters", (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0].properties.cluster_id;
        map.current
          .getSource("cars")
          .getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            map.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom,
            });
          });
      });

      map.current.on("click", "unclustered-point", (e) => {
        const car = e.features[0].properties;
        setSelectedCar(JSON.parse(car.carData));

        // Show popup
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(createCarPopupHTML(JSON.parse(car.carData)))
          .addTo(map.current);
      });

      // Change cursor on hover
      map.current.on("mouseenter", "clusters", () => {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "clusters", () => {
        map.current.getCanvas().style.cursor = "";
      });
    });
  };

  const fetchCars = async () => {
    setLoading(true);
    try {
      const response = await API.get("/cars");
      if (response.data.success) {
        const carsWithLocation = response.data.data.cars.filter(
          (car) => car.location && car.location.coordinates
        );
        setCars(carsWithLocation);
        setFilteredCars(carsWithLocation);
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchCarsInArea = async (bounds) => {
    // Filter cars that are within the current map bounds
    const carsInBounds = cars.filter((car) => {
      const [lng, lat] = car.location.coordinates;
      return bounds.contains([lng, lat]);
    });
    setFilteredCars(carsInBounds);
  };

  const updateMapMarkers = () => {
    if (!map.current) return;

    const features = filteredCars.map((car) => ({
      type: "Feature",
      properties: {
        carId: car._id,
        carData: JSON.stringify(car),
      },
      geometry: {
        type: "Point",
        coordinates: car.location.coordinates,
      },
    }));

    map.current.getSource("cars").setData({
      type: "FeatureCollection",
      features,
    });
  };

  const createCarPopupHTML = (car) => {
    return `
      <div class="p-3 min-w-[200px]">
        <img src="${car.images[0]}" alt="${car.title}" class="w-full h-24 object-cover rounded mb-2">
        <h3 class="font-semibold text-sm mb-1">${car.title}</h3>
        <div class="flex justify-between items-center mb-2">
          <span class="text-green-600 font-bold">AED ${car.price}/day</span>
          <span class="text-xs text-gray-500">${car.city}</span>
        </div>
        <button 
          onclick="window.location.href='/cars/${car._id}'"
          class="w-full bg-green-600 text-white py-1 px-2 rounded text-xs hover:bg-green-700"
        >
          View Details
        </button>
      </div>
    `;
  };

  const applyFilters = () => {
    let filtered = cars;

    if (filters.priceMin) {
      filtered = filtered.filter(
        (car) => car.price >= parseFloat(filters.priceMin)
      );
    }
    if (filters.priceMax) {
      filtered = filtered.filter(
        (car) => car.price <= parseFloat(filters.priceMax)
      );
    }
    if (filters.transmission) {
      filtered = filtered.filter(
        (car) => car.transmission === filters.transmission
      );
    }

    setFilteredCars(filtered);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Find Cars Near You
          </h1>

          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("map")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "map"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <MapIcon className="w-4 h-4 mr-1 inline" />
                Map
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="w-4 h-4 mr-1 inline" />
                List
              </button>
            </div>

            {/* Results Count */}
            <span className="text-sm text-gray-600">
              {filteredCars.length} cars found
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <input
              type="number"
              placeholder="Min Price"
              value={filters.priceMin}
              onChange={(e) =>
                setFilters({ ...filters, priceMin: e.target.value })
              }
              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max Price"
              value={filters.priceMax}
              onChange={(e) =>
                setFilters({ ...filters, priceMax: e.target.value })
              }
              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <select
            value={filters.transmission}
            onChange={(e) =>
              setFilters({ ...filters, transmission: e.target.value })
            }
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">All Transmissions</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>

          <button
            onClick={applyFilters}
            className="px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Map View */}
        {viewMode === "map" && (
          <div className="flex-1 relative">
            <div ref={mapContainer} className="w-full h-full" />

            {loading && (
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm">Loading cars...</span>
                </div>
              </div>
            )}

            {/* Search in this area button */}
            <button
              onClick={() => searchCarsInArea(map.current.getBounds())}
              className="absolute top-4 right-4 bg-white hover:bg-gray-50 border border-gray-300 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors"
            >
              Search this area
            </button>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCars.map((car) => (
                  <div
                    key={car._id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img
                      src={car.images[0]}
                      alt={car.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {car.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {car.location?.name}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-green-600 font-bold">
                          AED {car.price}/day
                        </span>
                        <button
                          onClick={() =>
                            (window.location.href = `/cars/${car._id}`)
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCars.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No cars found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your filters or search in a different area.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSearchView;
