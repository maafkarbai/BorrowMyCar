import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CarCard from '../../components/CarCard';

// Mock UserAvatar component
vi.mock('../../components/UserAvatar', () => {
  return {
    default: ({ user, size, className }) => (
      <div data-testid="user-avatar" className={className}>
        {user?.name || 'Owner'}
      </div>
    )
  };
});

const mockCar = {
  _id: '123',
  title: 'Toyota Camry',
  make: 'Toyota',
  model: 'Camry',
  year: 2023,
  city: 'Dubai',
  price: 150,
  pricePerDay: 150,
  fuelType: 'Petrol',
  transmission: 'Automatic',
  seatingCapacity: 5,
  status: 'active',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  owner: {
    _id: 'owner123',
    name: 'John Doe',
    phone: '0501234567',
    averageRating: 4.5
  },
  averageRating: 4.3,
  securityDeposit: 500,
  minimumRentalDays: 1
};

const CarCardWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('CarCard Component', () => {
  describe('Basic Rendering', () => {
    it('renders car information correctly', () => {
      render(
        <CarCardWrapper>
          <CarCard car={mockCar} />
        </CarCardWrapper>
      );

      expect(screen.getByText('Toyota • Camry • Other')).toBeInTheDocument();
      expect(screen.getByText('Dubai, Dubai')).toBeInTheDocument();
      expect(screen.getByText('AED 150')).toBeInTheDocument();
      expect(screen.getByText('per day')).toBeInTheDocument();
    });

    it('displays car specifications', () => {
      render(
        <CarCardWrapper>
          <CarCard car={mockCar} />
        </CarCardWrapper>
      );

      expect(screen.getByText('2023')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Seating capacity
      expect(screen.getByText('5+')).toBeInTheDocument(); // Doors
    });

    it('shows owner information', () => {
      render(
        <CarCardWrapper>
          <CarCard car={mockCar} />
        </CarCardWrapper>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument(); // Owner rating
      expect(screen.getByText('Call')).toBeInTheDocument();
    });

    it('displays pricing options', () => {
      render(
        <CarCardWrapper>
          <CarCard car={mockCar} />
        </CarCardWrapper>
      );

      expect(screen.getByText('Weekly Rent')).toBeInTheDocument();
      expect(screen.getByText('Monthly Rent')).toBeInTheDocument();
      expect(screen.getByText('AED 975')).toBeInTheDocument(); // Weekly price
      expect(screen.getByText('AED 4200')).toBeInTheDocument(); // Monthly price
    });
  });

  describe('Image Carousel', () => {
    it('displays first image by default', () => {
      render(
        <CarCardWrapper>
          <CarCard car={mockCar} />
        </CarCardWrapper>
      );

      const image = screen.getByAltText('Toyota Camry - Image 1');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockCar.images[0]);
    });

    it('shows image indicators for multiple images', () => {
      render(
        <CarCardWrapper>
          <CarCard car={mockCar} />
        </CarCardWrapper>
      );

      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('navigates to next image when next button is clicked', () => {
      render(
        <CarCardWrapper>
          <CarCard car={mockCar} />
        </CarCardWrapper>
      );

      const nextButton = screen.getByLabelText('Next image');
      fireEvent.click(nextButton);

      const image = screen.getByAltText('Toyota Camry - Image 2');
      expect(image).toHaveAttribute('src', mockCar.images[1]);
    });

    it('navigates to previous image when previous button is clicked', () => {
      render(
        <CarCardWrapper>
          <CarCard car={mockCar} />
        </CarCardWrapper>
      );

      const nextButton = screen.getByLabelText('Next image');
      fireEvent.click(nextButton); // Go to second image

      const prevButton = screen.getByLabelText('Previous image');
      fireEvent.click(prevButton); // Go back to first image

      const image = screen.getByAltText('Toyota Camry - Image 1');
      expect(image).toHaveAttribute('src', mockCar.images[0]);
    });
  });

  describe('Car Status', () => {
    it('shows unavailable overlay when car is not active', () => {
      const unavailableCar = { ...mockCar, status: 'inactive' };
      
      render(
        <CarCardWrapper>
          <CarCard car={unavailableCar} />
        </CarCardWrapper>
      );

      expect(screen.getByText('Unavailable')).toBeInTheDocument();
      
      const button = screen.getByText('Unavailable');
      expect(button).toBeDisabled();
    });

    it('shows Book Now button when car is active', () => {
      render(
        <CarCardWrapper>
          <CarCard car={mockCar} />
        </CarCardWrapper>
      );

      const bookButton = screen.getByText('Book Now');
      expect(bookButton).toBeInTheDocument();
      expect(bookButton).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('shows default image when car image fails to load', () => {
      const carWithoutImages = { ...mockCar, images: [] };
      
      render(
        <CarCardWrapper>
          <CarCard car={carWithoutImages} />
        </CarCardWrapper>
      );

      const image = screen.getByAltText('Toyota Camry - Image 1');
      expect(image).toHaveAttribute('src', '/default-car.jpg');
    });

    it('handles missing owner information gracefully', () => {
      const carWithoutOwner = { ...mockCar, owner: null };
      
      render(
        <CarCardWrapper>
          <CarCard car={carWithoutOwner} />
        </CarCardWrapper>
      );

      expect(screen.getByText('Owner')).toBeInTheDocument();
    });
  });
});