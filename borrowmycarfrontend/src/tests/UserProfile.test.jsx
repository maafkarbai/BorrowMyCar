import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserProfile from '../UserProfile';
import API from '../api';

// Mock the API
vi.mock('../api');

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ userId: 'user123' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock CarCard component
vi.mock('../components/CarCard', () => ({
  default: ({ car }) => (
    <div data-testid="car-card">
      <h3>{car.title}</h3>
      <p>AED {car.price}</p>
    </div>
  )
}));

const mockUserData = {
  id: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+971501234567',
  profileImage: 'https://example.com/profile.jpg',
  preferredCity: 'Dubai',
  createdAt: '2023-01-01T00:00:00.000Z',
  averageRating: 4.5,
  totalBookings: 15,
  totalListings: 3,
};

const mockCars = [
  {
    _id: 'car1',
    title: 'Toyota Camry 2023',
    price: 150,
    pricePerDay: 150,
    year: 2023,
    city: 'Dubai',
    images: ['https://example.com/car1.jpg'],
  },
  {
    _id: 'car2',
    title: 'Honda Accord 2022',
    price: 120,
    pricePerDay: 120,
    year: 2022,
    city: 'Dubai',
    images: ['https://example.com/car2.jpg'],
  },
];

const mockApiResponse = {
  data: {
    success: true,
    data: {
      user: mockUserData,
      cars: mockCars,
    },
  },
};

const renderUserProfile = () => {
  return render(
    <BrowserRouter>
      <UserProfile />
    </BrowserRouter>
  );
};

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    API.get.mockResolvedValue(mockApiResponse);
  });

  it('renders loading state initially', () => {
    API.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderUserProfile();

    expect(screen.getByText('Loading user profile...')).toBeInTheDocument();
  });

  it('displays user information correctly', async () => {
    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Dubai')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('rating')).toBeInTheDocument();
  });

  it('displays profile image when available', async () => {
    renderUserProfile();

    await waitFor(() => {
      const profileImage = screen.getByAltText('John Doe');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage.src).toBe('https://example.com/profile.jpg');
    });
  });

  it('shows default user icon when no profile image', async () => {
    const responseWithoutImage = {
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        data: {
          ...mockApiResponse.data.data,
          user: { ...mockUserData, profileImage: null }
        }
      }
    };
    API.get.mockResolvedValue(responseWithoutImage);

    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Should show user icon instead of image
    expect(screen.queryByAltText('John Doe')).not.toBeInTheDocument();
  });

  it('displays contact information correctly', async () => {
    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('Call Now')).toBeInTheDocument();
      expect(screen.getByText('Send Email')).toBeInTheDocument();
    });

    const phoneLink = screen.getByText('+971501234567').closest('a');
    expect(phoneLink.href).toBe('tel:+971501234567');

    const emailLink = screen.getByText('john@example.com').closest('a');
    expect(emailLink.href).toBe('mailto:john@example.com');
  });

  it('displays user statistics correctly', async () => {
    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total listings
      expect(screen.getByText('15')).toBeInTheDocument(); // Total bookings
      expect(screen.getByText('Car Listings')).toBeInTheDocument();
      expect(screen.getByText('Total Bookings')).toBeInTheDocument();
    });
  });

  it('formats join date correctly', async () => {
    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('Member since January 2023')).toBeInTheDocument();
    });
  });

  it('displays car listings section title', async () => {
    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText("John Doe's Car Listings")).toBeInTheDocument();
      expect(screen.getByText('2 active cars available for rent')).toBeInTheDocument();
    });
  });

  it('renders car cards for each listing', async () => {
    renderUserProfile();

    await waitFor(() => {
      const carCards = screen.getAllByTestId('car-card');
      expect(carCards).toHaveLength(2);
      
      expect(screen.getByText('Toyota Camry 2023')).toBeInTheDocument();
      expect(screen.getByText('Honda Accord 2022')).toBeInTheDocument();
    });
  });

  it('displays no cars message when user has no listings', async () => {
    const responseWithoutCars = {
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        data: {
          ...mockApiResponse.data.data,
          cars: []
        }
      }
    };
    API.get.mockResolvedValue(responseWithoutCars);

    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('No Cars Listed Yet')).toBeInTheDocument();
      expect(screen.getByText("John Doe hasn't listed any cars for rent at the moment.")).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    API.get.mockRejectedValue(new Error('Network error'));

    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('User Not Found')).toBeInTheDocument();
      expect(screen.getByText('Failed to load user profile. Please try again.')).toBeInTheDocument();
    });
  });

  it('handles 404 user not found', async () => {
    API.get.mockRejectedValue({
      response: { data: { message: 'User not found' } }
    });

    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('User Not Found')).toBeInTheDocument();
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('makes API call with correct user ID', async () => {
    renderUserProfile();

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith('/auth/users/user123');
    });
  });

  it('displays back to car listings link', async () => {
    renderUserProfile();

    await waitFor(() => {
      const backLink = screen.getByText('Back to Car Listings');
      expect(backLink).toBeInTheDocument();
    });
  });

  it('displays back to home link in error state', async () => {
    API.get.mockRejectedValue(new Error('Error'));

    renderUserProfile();

    await waitFor(() => {
      const backLink = screen.getByText('Back to Home');
      expect(backLink).toBeInTheDocument();
    });
  });

  it('handles user without rating', async () => {
    const responseWithoutRating = {
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        data: {
          ...mockApiResponse.data.data,
          user: { ...mockUserData, averageRating: 0 }
        }
      }
    };
    API.get.mockResolvedValue(responseWithoutRating);

    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Should not display rating section when rating is 0
    expect(screen.queryByText('rating')).not.toBeInTheDocument();
  });

  it('handles singular car listing text correctly', async () => {
    const responseWithOneCar = {
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        data: {
          ...mockApiResponse.data.data,
          cars: [mockCars[0]]
        }
      }
    };
    API.get.mockResolvedValue(responseWithOneCar);

    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('1 active car available for rent')).toBeInTheDocument();
    });
  });

  it('passes correct props to CarCard components', async () => {
    renderUserProfile();

    await waitFor(() => {
      // Car cards should be rendered with user data attached
      expect(screen.getByText('Toyota Camry 2023')).toBeInTheDocument();
      expect(screen.getByText('Honda Accord 2022')).toBeInTheDocument();
    });
  });

  it('has responsive layout classes', async () => {
    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check for responsive grid classes
    const container = screen.getByText('John Doe').closest('.grid');
    expect(container).toHaveClass('grid-cols-1');
    expect(container).toHaveClass('lg:grid-cols-3');
  });
});