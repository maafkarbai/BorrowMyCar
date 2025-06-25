import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { signup, login } from '../../controllers/authController.js';
import { createCar, getCars } from '../../controllers/carController.js';
import { createBooking, getMyBookings, updateBookingStatus } from '../../controllers/bookingController.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { User } from '../../models/User.js';
import Car from '../../models/Car.js';
import Booking from '../../models/Booking.js';

const app = express();
app.use(express.json());

// Mock file upload middleware
app.use((req, res, next) => {
  req.files = [
    { path: 'test1.jpg' },
    { path: 'test2.jpg' },
    { path: 'test3.jpg' }
  ];
  next();
});

// Routes
app.post('/auth/signup', signup);
app.post('/auth/login', login);
app.post('/cars', protect, createCar);
app.get('/cars', getCars);
app.post('/bookings', protect, createBooking);
app.get('/bookings/my', protect, getMyBookings);
app.put('/bookings/:id/status', protect, updateBookingStatus);

// Mock Cloudinary
jest.mock('../../utils/cloudUploader.js', () => ({
  uploadImagesToCloud: jest.fn().mockResolvedValue([
    'http://example.com/image1.jpg',
    'http://example.com/image2.jpg',
    'http://example.com/image3.jpg'
  ]),
  deleteImagesFromCloud: jest.fn().mockResolvedValue(true),
}));

describe('Car Booking Integration Flow', () => {
  let ownerToken, renterToken, carId;

  beforeAll(async () => {
    // Create owner user and get token
    const ownerSignupData = {
      name: 'Car Owner',
      email: 'owner@test.com',
      phone: '0501234567',
      password: 'password123',
      role: 'owner',
    };

    const ownerSignupResponse = await request(app)
      .post('/auth/signup')
      .send(ownerSignupData);

    ownerToken = ownerSignupResponse.body.token;

    // Approve the owner manually
    await User.findOneAndUpdate(
      { email: 'owner@test.com' },
      { isApproved: true }
    );

    // Create renter user and get token
    const renterSignupData = {
      name: 'Car Renter',
      email: 'renter@test.com',
      phone: '0509876543',
      password: 'password123',
      role: 'renter',
    };

    const renterSignupResponse = await request(app)
      .post('/auth/signup')
      .send(renterSignupData);

    renterToken = renterSignupResponse.body.token;

    // Approve the renter manually
    await User.findOneAndUpdate(
      { email: 'renter@test.com' },
      { isApproved: true }
    );
  });

  describe('Complete Car Rental Flow', () => {
    it('should allow owner to list a car', async () => {
      const carData = {
        title: 'BMW X5 2023',
        description: 'Luxury SUV perfect for families',
        make: 'BMW',
        model: 'X5',
        year: 2023,
        color: 'Black',
        pricePerDay: 300,
        transmission: 'Automatic',
        fuelType: 'Petrol',
        seatingCapacity: 7,
        city: 'Dubai',
        plateNumber: 'D54321',
        availabilityFrom: new Date().toISOString(),
        availabilityTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post('/cars')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(carData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.car.title).toBe(carData.title);
      expect(response.body.data.car.price).toBe(carData.pricePerDay);

      carId = response.body.data.car._id;
    });

    it('should display the car in listings', async () => {
      const response = await request(app)
        .get('/cars');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cars).toHaveLength(1);
      expect(response.body.data.cars[0]._id).toBe(carId);
      expect(response.body.data.cars[0].title).toBe('BMW X5 2023');
    });

    it('should allow renter to create a booking', async () => {
      const bookingData = {
        carId: carId,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        paymentMethod: 'Card',
        pickupLocation: 'Dubai International Airport',
        returnLocation: 'Dubai International Airport',
        deliveryRequested: false,
        renterNotes: 'Need the car for a business trip',
      };

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.car.toString()).toBe(carId);
      expect(response.body.data.booking.totalDays).toBe(3);
      expect(response.body.data.booking.totalAmount).toBe(900); // 3 days * 300 AED
      expect(response.body.data.booking.status).toBe('pending');
      expect(response.body.data.booking.renterNotes).toBe('Need the car for a business trip');
    });

    it('should show booking in renter\'s bookings', async () => {
      const response = await request(app)
        .get('/bookings/my')
        .set('Authorization', `Bearer ${renterToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].car.title).toBe('BMW X5 2023');
      expect(response.body.data.bookings[0].status).toBe('pending');
    });

    it('should show booking in owner\'s bookings', async () => {
      const response = await request(app)
        .get('/bookings/my')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].renter.name).toBe('Car Renter');
      expect(response.body.data.bookings[0].status).toBe('pending');
    });

    it('should allow owner to approve the booking', async () => {
      // First get the booking ID
      const bookingsResponse = await request(app)
        .get('/bookings/my')
        .set('Authorization', `Bearer ${ownerToken}`);

      const bookingId = bookingsResponse.body.data.bookings[0]._id;

      // Approve the booking
      const response = await request(app)
        .put(`/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'approved' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('approved');
    });

    it('should prevent double booking of the same car', async () => {
      const conflictingBookingData = {
        carId: carId,
        startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // Overlapping dates
        endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'Cash',
        pickupLocation: 'Downtown Dubai',
        returnLocation: 'Downtown Dubai',
      };

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send(conflictingBookingData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Car is not available for the selected dates');
      expect(response.body.conflictingBooking).toBeDefined();
    });

    it('should allow booking for non-overlapping dates', async () => {
      const validBookingData = {
        carId: carId,
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // Non-overlapping dates
        endDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'Cash',
        pickupLocation: 'Sharjah',
        returnLocation: 'Sharjah',
      };

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send(validBookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.totalDays).toBe(2);
      expect(response.body.data.booking.totalAmount).toBe(600); // 2 days * 300 AED
    });
  });

  describe('Booking Validation and Edge Cases', () => {
    it('should prevent owner from booking their own car', async () => {
      const bookingData = {
        carId: carId,
        startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'Card',
      };

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You cannot book your own car');
    });

    it('should require user approval before booking', async () => {
      // Create an unapproved user
      const unapprovedUserData = {
        name: 'Unapproved User',
        email: 'unapproved@test.com',
        phone: '0505555555',
        password: 'password123',
        role: 'renter',
      };

      const signupResponse = await request(app)
        .post('/auth/signup')
        .send(unapprovedUserData);

      const unapprovedToken = signupResponse.body.token;

      const bookingData = {
        carId: carId,
        startDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'Card',
      };

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${unapprovedToken}`)
        .send(bookingData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ACCOUNT_NOT_APPROVED');
    });

    it('should calculate pricing correctly with delivery fee', async () => {
      // Update car to have delivery fee
      await Car.findByIdAndUpdate(carId, { 
        deliveryFee: 50,
        securityDeposit: 500 
      });

      const bookingData = {
        carId: carId,
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'Card',
        deliveryRequested: true,
        deliveryAddress: '123 Test Street, Dubai',
      };

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.totalDays).toBe(2);
      expect(response.body.data.booking.totalAmount).toBe(600); // 2 days * 300 AED
      expect(response.body.data.booking.deliveryFee).toBe(50);
      expect(response.body.data.booking.securityDeposit).toBe(500);
      expect(response.body.data.booking.totalPayable).toBe(1150); // 600 + 50 + 500
    });
  });
});