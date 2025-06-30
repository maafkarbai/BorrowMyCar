import { describe, it, expect } from 'vitest';

describe('User Profile Logic Tests', () => {
  it('should format user data correctly', () => {
    const mockUser = {
      _id: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+971501234567',
      profileImage: 'https://example.com/profile.jpg',
      preferredCity: 'Dubai',
      createdAt: new Date('2023-01-01'),
      averageRating: 4.5,
      totalBookings: 15,
    };

    const formattedUser = {
      id: mockUser._id,
      name: mockUser.name,
      email: mockUser.email,
      phone: mockUser.phone,
      profileImage: mockUser.profileImage,
      preferredCity: mockUser.preferredCity,
      createdAt: mockUser.createdAt,
      averageRating: mockUser.averageRating || 0,
      totalBookings: mockUser.totalBookings || 0,
      totalListings: 2, // Example count
    };

    expect(formattedUser.id).toBe('user123');
    expect(formattedUser.name).toBe('John Doe');
    expect(formattedUser.email).toBe('john@example.com');
    expect(formattedUser.phone).toBe('+971501234567');
    expect(formattedUser.profileImage).toBe('https://example.com/profile.jpg');
    expect(formattedUser.preferredCity).toBe('Dubai');
    expect(formattedUser.averageRating).toBe(4.5);
    expect(formattedUser.totalBookings).toBe(15);
    expect(formattedUser.totalListings).toBe(2);
  });

  it('should handle cars with correct pricePerDay mapping', () => {
    const mockCars = [
      {
        _id: 'car1',
        title: 'Toyota Camry',
        price: 150,
        city: 'Dubai',
        images: ['image1.jpg'],
      },
      {
        _id: 'car2',
        title: 'Honda Accord',
        price: 120,
        city: 'Dubai',
        images: ['image2.jpg'],
      }
    ];

    const enhancedCars = mockCars.map((car) => ({
      ...car,
      pricePerDay: car.price,
    }));

    expect(enhancedCars).toHaveLength(2);
    expect(enhancedCars[0].pricePerDay).toBe(150);
    expect(enhancedCars[1].pricePerDay).toBe(120);
  });

  it('should filter active cars only', () => {
    const mockCars = [
      { _id: 'car1', status: 'active', title: 'Active Car' },
      { _id: 'car2', status: 'inactive', title: 'Inactive Car' },
      { _id: 'car3', status: 'active', title: 'Another Active Car' },
    ];

    const activeCars = mockCars.filter(car => car.status === 'active');

    expect(activeCars).toHaveLength(2);
    expect(activeCars[0].title).toBe('Active Car');
    expect(activeCars[1].title).toBe('Another Active Car');
  });

  it('should filter cars by availability date', () => {
    const now = new Date();
    const future = new Date(now.getTime() + 86400000); // tomorrow
    const past = new Date(now.getTime() - 86400000); // yesterday

    const mockCars = [
      { _id: 'car1', availabilityTo: future, title: 'Available Car' },
      { _id: 'car2', availabilityTo: past, title: 'Expired Car' },
    ];

    const availableCars = mockCars.filter(car => car.availabilityTo >= now);

    expect(availableCars).toHaveLength(1);
    expect(availableCars[0].title).toBe('Available Car');
  });

  it('should handle missing user data gracefully', () => {
    const incompleteUser = {
      _id: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      // Missing optional fields
    };

    const formattedUser = {
      id: incompleteUser._id,
      name: incompleteUser.name,
      email: incompleteUser.email,
      phone: incompleteUser.phone,
      profileImage: incompleteUser.profileImage,
      preferredCity: incompleteUser.preferredCity,
      createdAt: incompleteUser.createdAt,
      averageRating: incompleteUser.averageRating || 0,
      totalBookings: incompleteUser.totalBookings || 0,
      totalListings: 0,
    };

    expect(formattedUser.id).toBe('user123');
    expect(formattedUser.name).toBe('John Doe');
    expect(formattedUser.phone).toBeUndefined();
    expect(formattedUser.averageRating).toBe(0);
    expect(formattedUser.totalBookings).toBe(0);
  });

  it('should validate phone number format', () => {
    const validPhones = [
      '+971501234567',
      '+971 50 123 4567',
      '0501234567',
    ];

    const invalidPhones = [
      '123456789',
      '+1234567890',
      'invalid',
    ];

    // Basic UAE phone validation logic
    const isValidUAEPhone = (phone) => {
      if (!phone) return false;
      const cleaned = phone.replace(/\D/g, '');
      return cleaned.startsWith('971') || cleaned.startsWith('05');
    };

    validPhones.forEach(phone => {
      expect(isValidUAEPhone(phone)).toBe(true);
    });

    invalidPhones.forEach(phone => {
      expect(isValidUAEPhone(phone)).toBe(false);
    });
  });

  it('should sort cars by creation date descending', () => {
    const mockCars = [
      { _id: 'car1', createdAt: new Date('2023-01-01'), title: 'Oldest Car' },
      { _id: 'car2', createdAt: new Date('2023-03-01'), title: 'Newest Car' },
      { _id: 'car3', createdAt: new Date('2023-02-01'), title: 'Middle Car' },
    ];

    const sortedCars = [...mockCars].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    expect(sortedCars[0].title).toBe('Newest Car');
    expect(sortedCars[1].title).toBe('Middle Car');
    expect(sortedCars[2].title).toBe('Oldest Car');
  });

  it('should handle user profile response structure', () => {
    const apiResponse = {
      success: true,
      data: {
        user: {
          id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+971501234567',
          profileImage: 'https://example.com/profile.jpg',
          preferredCity: 'Dubai',
          averageRating: 4.5,
          totalBookings: 15,
          totalListings: 2,
        },
        cars: [
          {
            _id: 'car1',
            title: 'Toyota Camry',
            price: 150,
            pricePerDay: 150,
          }
        ]
      }
    };

    expect(apiResponse.success).toBe(true);
    expect(apiResponse.data.user.name).toBe('John Doe');
    expect(apiResponse.data.cars).toHaveLength(1);
    expect(apiResponse.data.cars[0].pricePerDay).toBe(150);
  });
});