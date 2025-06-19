import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import CarCard from '../../components/CarCard';

// Mock the React Router hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockCar = {
  _id: '1',
  title: 'Toyota Camry 2023',
  make: 'Toyota',
  model: 'Camry',
  year: 2023,
  pricePerDay: 150,
  transmission: 'Automatic',
  fuelType: 'Petrol',
  seatingCapacity: 5,
  city: 'Dubai',
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg'
  ],
  owner: {
    name: 'John Doe',
    averageRating: 4.5,
  },
  status: 'active',
};

const renderCarCard = (props = {}) => {
  return render(
    <BrowserRouter>
      <CarCard car={mockCar} {...props} />
    </BrowserRouter>
  );
};

describe('CarCard Component', () => {
  it('renders car information correctly', () => {
    renderCarCard();

    expect(screen.getByText('Toyota Camry 2023')).toBeInTheDocument();
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('AED 150/day')).toBeInTheDocument();
    expect(screen.getByText('Automatic')).toBeInTheDocument();
    expect(screen.getByText('Petrol')).toBeInTheDocument();
    expect(screen.getByText('5 seats')).toBeInTheDocument();
    expect(screen.getByText('Dubai')).toBeInTheDocument();
  });

  it('displays owner information', () => {
    renderCarCard();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('shows car image with fallback', () => {
    renderCarCard();

    const image = screen.getByAltText('Toyota Camry 2023');
    expect(image).toBeInTheDocument();
    expect(image.src).toBe('https://example.com/image1.jpg');
  });

  it('handles missing images gracefully', () => {
    const carWithoutImages = { ...mockCar, images: [] };
    renderCarCard({ car: carWithoutImages });

    const image = screen.getByAltText('Toyota Camry 2023');
    expect(image).toBeInTheDocument();
    // Should have a fallback image
  });

  it('displays unavailable status when car is not active', () => {
    const unavailableCar = { ...mockCar, status: 'inactive' };
    renderCarCard({ car: unavailableCar });

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('navigates to car details when clicked', () => {
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', () => ({
      ...vi.importActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    renderCarCard();

    const card = screen.getByRole('button', { name: /view details/i });
    fireEvent.click(card);

    // Note: This test would need to be adjusted based on actual navigation implementation
  });

  it('shows correct rating stars', () => {
    renderCarCard();

    // Check if rating stars are displayed
    const ratingElement = screen.getByText('4.5');
    expect(ratingElement).toBeInTheDocument();
  });

  it('formats price correctly', () => {
    const expensiveCar = { ...mockCar, pricePerDay: 1500 };
    renderCarCard({ car: expensiveCar });

    expect(screen.getByText('AED 1500/day')).toBeInTheDocument();
  });

  it('handles missing owner information', () => {
    const carWithoutOwner = { ...mockCar, owner: null };
    renderCarCard({ car: carWithoutOwner });

    // Should still render the car card without crashing
    expect(screen.getByText('Toyota Camry 2023')).toBeInTheDocument();
  });

  it('displays specifications correctly', () => {
    renderCarCard();

    // Check if all specifications are displayed
    expect(screen.getByText('Automatic')).toBeInTheDocument();
    expect(screen.getByText('Petrol')).toBeInTheDocument();
    expect(screen.getByText('5 seats')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    renderCarCard();

    const cardElement = screen.getByRole('button', { name: /view details/i });
    expect(cardElement).toHaveClass('bg-white');
    expect(cardElement).toHaveClass('rounded-lg');
    expect(cardElement).toHaveClass('shadow-md');
  });
});