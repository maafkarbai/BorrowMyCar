import { expect, afterEach, vi, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Setup global mocks before all tests
beforeAll(() => {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  vi.stubGlobal('localStorage', localStorageMock);

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  vi.stubGlobal('sessionStorage', sessionStorageMock);

  // Mock document methods
  globalThis.document.getElementById = vi.fn();
  globalThis.document.querySelector = vi.fn();
  globalThis.document.querySelectorAll = vi.fn();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock URL and URLSearchParams
globalThis.URL = vi.fn().mockImplementation((url) => ({
  href: url,
  pathname: new URL(url).pathname,
  search: new URL(url).search,
  searchParams: new URLSearchParams(new URL(url).search),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  Link: ({ children, to, ...props }) => {
    const React = globalThis.require('react');
    return React.createElement('a', { href: to, ...props }, children);
  },
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
  useParams: () => ({}),
  Navigate: () => null,
}));

// Mock geolocation
Object.defineProperty(globalThis.navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn().mockImplementation((success) => {
      success({
        coords: {
          latitude: 25.2048,
          longitude: 55.2708,
        },
      });
    }),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  writable: true,
});

// Mock fetch for Nominatim API
globalThis.fetch = vi.fn().mockImplementation((url) => {
  if (url.includes('nominatim.openstreetmap.org')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          place_id: '123',
          display_name: 'Downtown Dubai, Dubai, UAE',
          lat: '25.1972',
          lon: '55.2744',
          address: {
            road: 'Sheikh Zayed Road',
            suburb: 'Downtown Dubai',
            city: 'Dubai',
            country: 'UAE',
          },
        },
      ]),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

// Mock API module
vi.mock('../api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => {
  const React = globalThis.require('react');
  const MockIcon = ({ className, ...props }) => 
    React.createElement('div', { className: `mock-icon ${className || ''}`, ...props });
  
  return new Proxy({}, {
    get: () => MockIcon,
  });
});

// Mock image loading
Object.defineProperty(HTMLImageElement.prototype, 'onload', {
  get() {
    return this._onload;
  },
  set(fn) {
    this._onload = fn;
    // Simulate successful image load
    setTimeout(() => fn && fn(), 0);
  },
});

Object.defineProperty(HTMLImageElement.prototype, 'onerror', {
  get() {
    return this._onerror;
  },
  set(fn) {
    this._onerror = fn;
  },
});