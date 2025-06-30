import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { User } from '../../models/User.js';
import Car from '../../models/Car.js';
import { getPublicUserProfile } from '../../controllers/authController.js';

const app = express();
app.use(express.json());
app.get('/auth/users/:userId', getPublicUserProfile);

describe('Public User Profile API', () => {
  let testUser;
  let testCars;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+971501234567',
      password: 'password123',
      role: 'owner',
      preferredCity: 'Dubai',
      isApproved: true,
      isEmailVerified: true,
      profileImage: 'https://example.com/profile.jpg',
      averageRating: 4.5,
      totalBookings: 15,
      drivingLicenseUrl: 'https://example.com/license.jpg',
      emiratesIdUrl: 'https://example.com/emirates-id.jpg',
    });

    // Create test cars for the user
    testCars = await Car.create([
      {
        owner: testUser._id,
        title: 'Toyota Camry 2023',
        description: 'Comfortable sedan for city driving',
        city: 'Dubai',
        price: 150,
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        color: 'White',
        plateNumber: 'A12345',
        transmission: 'Automatic',
        fuelType: 'Petrol',
        mileage: 25000,
        seatingCapacity: 5,
        specifications: 'GCC Specs',
        features: ['GPS Navigation', 'Bluetooth'],
        images: [
          'https://example.com/car1-1.jpg',
          'https://example.com/car1-2.jpg',
          'https://example.com/car1-3.jpg'
        ],
        availabilityFrom: new Date('2024-01-01'),
        availabilityTo: new Date('2024-12-31'),
        status: 'active',
      },
      {
        owner: testUser._id,
        title: 'Honda Accord 2022',
        description: 'Reliable and efficient car',
        city: 'Dubai',
        price: 120,
        make: 'Honda',
        model: 'Accord',
        year: 2022,
        color: 'Black',
        plateNumber: 'B67890',
        transmission: 'Automatic',
        fuelType: 'Petrol',
        mileage: 30000,
        seatingCapacity: 5,
        specifications: 'GCC Specs',
        features: ['Bluetooth', 'USB Charging'],
        images: [
          'https://example.com/car2-1.jpg',
          'https://example.com/car2-2.jpg',
          'https://example.com/car2-3.jpg'
        ],
        availabilityFrom: new Date('2024-01-01'),
        availabilityTo: new Date('2024-12-31'),
        status: 'active',
      },
      {
        owner: testUser._id,
        title: 'BMW X5 2021',
        description: 'Luxury SUV',
        city: 'Dubai',
        price: 300,
        make: 'BMW',
        model: 'X5',
        year: 2021,
        color: 'Blue',
        plateNumber: 'C11111',
        transmission: 'Automatic',
        fuelType: 'Petrol',
        mileage: 40000,
        seatingCapacity: 7,
        specifications: 'GCC Specs',
        features: ['GPS Navigation', 'Leather Seats'],
        images: [
          'https://example.com/car3-1.jpg',
          'https://example.com/car3-2.jpg',
          'https://example.com/car3-3.jpg'
        ],
        availabilityFrom: new Date('2024-01-01'),
        availabilityTo: new Date('2024-12-31'),
        status: 'inactive', // This should not be included in results
      }
    ]);
  });

  describe('GET /auth/users/:userId', () => {
    it('should return user profile with active car listings', async () => {
      const response = await request(app)
        .get(`/auth/users/${testUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const { user, cars } = response.body.data;

      // Check user data
      expect(user.id).toBe(testUser._id.toString());
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.phone).toBe('+971501234567');
      expect(user.profileImage).toBe('https://example.com/profile.jpg');
      expect(user.preferredCity).toBe('Dubai');
      expect(user.averageRating).toBe(4.5);
      expect(user.totalBookings).toBe(15);
      expect(user.totalListings).toBe(2); // Only active cars
      expect(user.createdAt).toBeDefined();

      // Check cars data
      expect(cars).toHaveLength(2); // Only active cars
      expect(cars[0].title).toBe('Honda Accord 2022'); // Sorted by createdAt desc
      expect(cars[1].title).toBe('Toyota Camry 2023');
      
      // Check car data format
      cars.forEach(car => {
        expect(car.pricePerDay).toBeDefined();
        expect(car.owner).toBeUndefined(); // Should not include owner field
      });
    });

    it('should return 400 for missing user ID', async () => {
      const response = await request(app)
        .get('/auth/users/')
        .expect(404); // Route not found
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/auth/users/${fakeUserId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });

    it('should return 400 for invalid user ID format', async () => {
      const response = await request(app)
        .get('/auth/users/invalid-id')
        .expect(500); // Mongoose validation error
    });

    it('should return empty cars array for user with no listings', async () => {
      // Create user without cars
      const userWithoutCars = await User.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+971507654321',
        password: 'password123',
        role: 'renter',
        preferredCity: 'Abu Dhabi',
        isApproved: true,
        isEmailVerified: true,
        drivingLicenseUrl: 'https://example.com/jane-license.jpg',
      });

      const response = await request(app)
        .get(`/auth/users/${userWithoutCars._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('Jane Smith');
      expect(response.body.data.cars).toHaveLength(0);
      expect(response.body.data.user.totalListings).toBe(0);
    });

    it('should not include expired car listings', async () => {
      // Create expired car
      await Car.create({
        owner: testUser._id,
        title: 'Expired Car',
        description: 'This car is expired',
        city: 'Dubai',
        price: 100,
        make: 'Ford',
        model: 'Focus',
        year: 2020,
        color: 'Red',
        plateNumber: 'D99999',
        transmission: 'Manual',
        fuelType: 'Petrol',
        mileage: 50000,
        seatingCapacity: 5,
        specifications: 'GCC Specs',
        features: ['Bluetooth'],
        images: [
          'https://example.com/expired1.jpg',
          'https://example.com/expired2.jpg',
          'https://example.com/expired3.jpg'
        ],
        availabilityFrom: new Date('2023-01-01'),
        availabilityTo: new Date('2023-12-31'), // Expired
        status: 'active',
      });

      const response = await request(app)
        .get(`/auth/users/${testUser._id}`)
        .expect(200);

      // Should still return only 2 active, non-expired cars
      expect(response.body.data.cars).toHaveLength(2);
      expect(response.body.data.user.totalListings).toBe(2);
    });

    it('should include profile image in response when available', async () => {
      const response = await request(app)
        .get(`/auth/users/${testUser._id}`)
        .expect(200);

      expect(response.body.data.user.profileImage).toBe('https://example.com/profile.jpg');
    });

    it('should handle user without profile image', async () => {
      // Update user to remove profile image
      await User.findByIdAndUpdate(testUser._id, { 
        $unset: { profileImage: 1 } 
      });

      const response = await request(app)
        .get(`/auth/users/${testUser._id}`)
        .expect(200);

      expect(response.body.data.user.profileImage).toBeUndefined();
    });

    it('should handle user without rating', async () => {
      // Update user to remove rating
      await User.findByIdAndUpdate(testUser._id, { 
        averageRating: 0,
        totalBookings: 0 
      });

      const response = await request(app)
        .get(`/auth/users/${testUser._id}`)
        .expect(200);

      expect(response.body.data.user.averageRating).toBe(0);
      expect(response.body.data.user.totalBookings).toBe(0);
    });

    it('should return cars sorted by creation date descending', async () => {
      const response = await request(app)
        .get(`/auth/users/${testUser._id}`)
        .expect(200);

      const cars = response.body.data.cars;
      expect(cars).toHaveLength(2);
      
      // Should be sorted by creation date, newest first
      const dates = cars.map(car => new Date(car.createdAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });

    it('should include required car fields', async () => {
      const response = await request(app)
        .get(`/auth/users/${testUser._id}`)
        .expect(200);

      const car = response.body.data.cars[0];
      
      // Check all required fields are present
      expect(car.title).toBeDefined();
      expect(car.price).toBeDefined();
      expect(car.pricePerDay).toBeDefined();
      expect(car.city).toBeDefined();
      expect(car.images).toBeDefined();
      expect(car.year).toBeDefined();
      expect(car.make).toBeDefined();
      expect(car.model).toBeDefined();
      expect(car.transmission).toBeDefined();
      expect(car.fuelType).toBeDefined();
      expect(car.status).toBe('active');
    });

    it('should handle database connection errors gracefully', async () => {
      // Temporarily close mongoose connection
      await mongoose.disconnect();

      const response = await request(app)
        .get(`/auth/users/${testUser._id}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INTERNAL_ERROR');

      // Reconnect for other tests
      const mongoUri = global.__MONGO_URI__ || process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
      await mongoose.connect(mongoUri);
    });
  });
});