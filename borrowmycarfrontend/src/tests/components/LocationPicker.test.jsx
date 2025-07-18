import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LocationPicker from '../../components/LocationPicker';

// Mock Mapbox
vi.mock('mapbox-gl', () => ({
  Map: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    remove: vi.fn(),
    getCenter: vi.fn(() => ({ lat: 25.2048, lng: 55.2708 })),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    addControl: vi.fn(),
    removeControl: vi.fn()
  })),
  Marker: vi.fn(() => ({
    setLngLat: vi.fn(),
    addTo: vi.fn(),
    remove: vi.fn()
  })),
  NavigationControl: vi.fn(),
  GeolocateControl: vi.fn()
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};

global.navigator.geolocation = mockGeolocation;

describe('LocationPicker Component', () => {
  const mockProps = {
    onLocationSelect: vi.fn(),
    initialLocation: { lat: 25.2048, lng: 55.2708 },
    placeholder: 'Select location'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 25.2048,
          longitude: 55.2708
        }
      });
    });
  });

  test('renders location picker with map', () => {
    render(<LocationPicker {...mockProps} />);

    expect(screen.getByPlaceholderText('Select location')).toBeInTheDocument();
    expect(screen.getByText('Use Current Location')).toBeInTheDocument();
  });

  test('handles location search', async () => {
    render(<LocationPicker {...mockProps} />);

    const searchInput = screen.getByPlaceholderText('Select location');
    fireEvent.change(searchInput, { target: { value: 'Dubai Mall' } });

    await waitFor(() => {
      expect(searchInput.value).toBe('Dubai Mall');
    });
  });

  test('handles current location button click', async () => {
    render(<LocationPicker {...mockProps} />);

    const currentLocationBtn = screen.getByText('Use Current Location');
    fireEvent.click(currentLocationBtn);

    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  test('handles geolocation errors', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 1,
        message: 'User denied geolocation'
      });
    });

    render(<LocationPicker {...mockProps} />);

    const currentLocationBtn = screen.getByText('Use Current Location');
    fireEvent.click(currentLocationBtn);

    await waitFor(() => {
      expect(screen.getByText('Location access denied')).toBeInTheDocument();
    });
  });

  test('calls onLocationSelect when location is chosen', async () => {
    render(<LocationPicker {...mockProps} />);

    const searchInput = screen.getByPlaceholderText('Select location');
    fireEvent.change(searchInput, { target: { value: 'Dubai Mall' } });

    // Simulate selecting a location
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    await waitFor(() => {
      expect(mockProps.onLocationSelect).toHaveBeenCalledWith({
        lat: expect.any(Number),
        lng: expect.any(Number),
        address: 'Dubai Mall'
      });
    });
  });

  test('validates UAE location boundaries', async () => {
    const outOfBoundsProps = {
      ...mockProps,
      initialLocation: { lat: 30.0, lng: 60.0 } // Outside UAE
    };

    render(<LocationPicker {...outOfBoundsProps} />);

    await waitFor(() => {
      expect(screen.getByText('Location must be within UAE')).toBeInTheDocument();
    });
  });
});