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

    const image = screen.getByAltText('Toyota Camry 2023 - Image 1');
    expect(image).toBeInTheDocument();
    expect(image.src).toBe('https://example.com/image1.jpg');
  });

  it('handles missing images gracefully', () => {
    const carWithoutImages = { ...mockCar, images: [] };
    renderCarCard({ car: carWithoutImages });

    const image = screen.getByAltText('Toyota Camry 2023 - Image 1');
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

  // Tests for new carousel functionality
  describe('Carousel Features', () => {
    it('displays carousel controls when multiple images exist', () => {
      renderCarCard();
      
      // Should show navigation arrows
      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
      
      // Should show image indicators
      const indicators = screen.getAllByRole('button', { name: /Go to image/i });
      expect(indicators).toHaveLength(2);
      
      // Should show image counter
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('hides carousel controls when only one image exists', () => {
      const carWithOneImage = {
        ...mockCar,
        images: ['https://example.com/image1.jpg']
      };
      renderCarCard({ car: carWithOneImage });
      
      // Should not show navigation arrows
      expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
      
      // Should not show image indicators
      expect(screen.queryByRole('button', { name: /Go to image/i })).not.toBeInTheDocument();
      
      // Should not show image counter
      expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
    });

    it('navigates to next image when next button is clicked', () => {
      renderCarCard();
      
      const nextButton = screen.getByLabelText('Next image');
      fireEvent.click(nextButton);
      
      // Should show second image
      const image = screen.getByAltText('Toyota Camry 2023 - Image 2');
      expect(image).toBeInTheDocument();
      expect(image.src).toBe('https://example.com/image2.jpg');
      
      // Should update counter
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    it('navigates to previous image when previous button is clicked', () => {
      renderCarCard();
      
      // First go to next image
      const nextButton = screen.getByLabelText('Next image');
      fireEvent.click(nextButton);
      
      // Then go back to previous
      const prevButton = screen.getByLabelText('Previous image');
      fireEvent.click(prevButton);
      
      // Should show first image again
      const image = screen.getByAltText('Toyota Camry 2023 - Image 1');
      expect(image).toBeInTheDocument();
      expect(image.src).toBe('https://example.com/image1.jpg');
      
      // Should update counter
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('cycles through images correctly', () => {
      renderCarCard();
      
      const nextButton = screen.getByLabelText('Next image');
      
      // Click next twice (should cycle back to first image)
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      
      // Should show first image again
      const image = screen.getByAltText('Toyota Camry 2023 - Image 1');
      expect(image).toBeInTheDocument();
      expect(image.src).toBe('https://example.com/image1.jpg');
      
      // Should update counter
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('navigates to specific image when indicator is clicked', () => {
      renderCarCard();
      
      const indicators = screen.getAllByRole('button', { name: /Go to image/i });
      fireEvent.click(indicators[1]); // Click second indicator
      
      // Should show second image
      const image = screen.getByAltText('Toyota Camry 2023 - Image 2');
      expect(image).toBeInTheDocument();
      expect(image.src).toBe('https://example.com/image2.jpg');
      
      // Should update counter
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    it('prevents event bubbling on carousel controls', () => {
      const mockStopPropagation = vi.fn();
      renderCarCard();
      
      const nextButton = screen.getByLabelText('Next image');
      
      // Simulate click event
      fireEvent.click(nextButton, { 
        stopPropagation: mockStopPropagation 
      });
      
      expect(nextButton).toBeInTheDocument();
    });

    it('shows correct image counter format', () => {
      const carWithManyImages = {
        ...mockCar,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
          'https://example.com/image4.jpg'
        ]
      };
      renderCarCard({ car: carWithManyImages });
      
      expect(screen.getByText('1 / 4')).toBeInTheDocument();
    });
  });
});