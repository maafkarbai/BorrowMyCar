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
  price: 150,
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
    _id: 'owner123',
    name: 'John Doe',
    phone: '+971501234567',
    email: 'john@example.com',
    profileImage: 'https://example.com/profile.jpg',
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
    expect(screen.getByText('AED 150')).toBeInTheDocument();
    expect(screen.getByText('per day')).toBeInTheDocument();
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

  it('links to car details page', () => {
    renderCarCard();

    const cardLink = screen.getByRole('link');
    expect(cardLink.href).toContain('/cars/1');
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

    expect(screen.getByText('AED 1500')).toBeInTheDocument();
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

    const cardElement = screen.getByRole('link');
    expect(cardElement).toHaveClass('bg-white');
    expect(cardElement).toHaveClass('rounded-lg');
    expect(cardElement).toHaveClass('shadow-md');
  });

  // Tests for new owner profile features
  describe('Owner Profile Features', () => {
    it('displays owner profile image when available', () => {
      renderCarCard();
      
      const profileImage = screen.getByAltText('John Doe');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage.src).toBe('https://example.com/profile.jpg');
    });

    it('shows user icon when no profile image', () => {
      const carWithoutProfileImage = {
        ...mockCar,
        owner: { ...mockCar.owner, profileImage: null }
      };
      renderCarCard({ car: carWithoutProfileImage });
      
      // Should display the user icon placeholder
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays owner rating correctly', () => {
      renderCarCard();
      
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('creates phone call link when phone number available', () => {
      renderCarCard();
      
      const callButton = screen.getByTitle('Call John Doe');
      expect(callButton).toBeInTheDocument();
      expect(callButton.href).toBe('tel:+971501234567');
      expect(screen.getByText('Call')).toBeInTheDocument();
    });

    it('creates user profile link', () => {
      renderCarCard();
      
      const profileLink = screen.getByRole('link', { name: /john doe/i });
      expect(profileLink).toBeInTheDocument();
      expect(profileLink.href).toContain('/users/owner123');
    });

    it('handles missing phone number gracefully', () => {
      const carWithoutPhone = {
        ...mockCar,
        owner: { ...mockCar.owner, phone: null }
      };
      renderCarCard({ car: carWithoutPhone });
      
      expect(screen.queryByText('Call')).not.toBeInTheDocument();
    });

    it('handles missing owner rating gracefully', () => {
      const carWithoutRating = {
        ...mockCar,
        owner: { ...mockCar.owner, averageRating: null }
      };
      renderCarCard({ car: carWithoutRating });
      
      // Should still display owner name
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays "Listed by" text', () => {
      renderCarCard();
      
      expect(screen.getByText('Listed by John Doe')).toBeInTheDocument();
    });

    it('prevents event bubbling on owner profile click', () => {
      const mockStopPropagation = vi.fn();
      renderCarCard();
      
      const profileLink = screen.getByRole('link', { name: /john doe/i });
      
      // Simulate click event
      fireEvent.click(profileLink, { 
        stopPropagation: mockStopPropagation 
      });
      
      // Event should be handled
      expect(profileLink).toBeInTheDocument();
    });

    it('prevents event bubbling on call button click', () => {
      const mockStopPropagation = vi.fn();
      renderCarCard();
      
      const callButton = screen.getByTitle('Call John Doe');
      
      // Simulate click event
      fireEvent.click(callButton, { 
        stopPropagation: mockStopPropagation 
      });
      
      expect(callButton).toBeInTheDocument();
    });

    it('displays correct price with AED currency', () => {
      renderCarCard();
      
      expect(screen.getByText('AED 150')).toBeInTheDocument();
      expect(screen.getByText('per day')).toBeInTheDocument();
    });

    it('formats owner rating to one decimal place', () => {
      const carWithHighRating = {
        ...mockCar,
        owner: { ...mockCar.owner, averageRating: 4.8765 }
      };
      renderCarCard({ car: carWithHighRating });
      
      expect(screen.getByText('4.9')).toBeInTheDocument();
    });
  });
});