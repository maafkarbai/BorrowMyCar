import request from 'supertest';
import express from 'express';
import { 
  createBooking, 
  getMyBookings, 
  updateBookingStatus, 
  getBookingById,
  cancelBooking,
  addReview 
} from '../../controllers/bookingController.js';
import { protect } from '../../middlewares/authMiddleware.js';
import Booking from '../../models/Booking.js';
import { createTestUser, createTestCar } from '../helpers/testHelpers.js';

const app = express();
app.use(express.json());

// Routes
app.post('/bookings', protect, createBooking);
app.get('/bookings/my', protect, getMyBookings);
app.get('/bookings/:id', protect, getBookingById);
app.put('/bookings/:id/status', protect, updateBookingStatus);
app.put('/bookings/:id/cancel', protect, cancelBooking);
app.post('/bookings/:id/review', protect, addReview);

describe('Booking Controller', () => {
  let ownerUser, ownerToken, renterUser, renterToken, testCar, testBooking;

  beforeEach(async () => {
    // Create test users
    const ownerData = await createTestUser({
      email: 'owner@example.com',
      role: 'owner',
      isApproved: true,
    });
    ownerUser = ownerData.user;
    ownerToken = ownerData.token;

    const renterData = await createTestUser({
      email: 'renter@example.com',
      role: 'renter',
      isApproved: true,
    });
    renterUser = renterData.user;
    renterToken = renterData.token;

    // Create test car with available status
    testCar = await createTestCar(ownerUser, { status: 'available' });

    // Create test booking
    testBooking = await Booking.create({
      renter: renterUser._id,
      car: testCar._id,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      totalDays: 2,
      dailyRate: testCar.price,
      totalAmount: testCar.price * 2,
      totalPayable: testCar.price * 2,
      paymentMethod: 'Cash',
      pickupLocation: 'Dubai Mall',
      returnLocation: 'Dubai Mall',
      status: 'pending',
    });
  });

  describe('POST /bookings', () => {
    it('should create a booking successfully', async () => {
      const bookingData = {
        carId: testCar._id.toString(),
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        paymentMethod: 'Card',
        pickupLocation: 'Dubai International Airport',
        returnLocation: 'Dubai International Airport',
        deliveryRequested: false,
      };

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.car.toString()).toBe(testCar._id.toString());
      expect(response.body.data.booking.renter.toString()).toBe(renterUser._id.toString());
      expect(response.body.data.booking.totalDays).toBe(2);
      expect(response.body.data.booking.paymentMethod).toBe('Card');
      expect(response.body.message).toBe('Booking created successfully');
    });

    it('should return error for unapproved user', async () => {
      const { token } = await createTestUser({
        email: 'unapproved@example.com',
        role: 'renter',
        isApproved: false,
      });

      const bookingData = {
        carId: testCar._id.toString(),
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send(bookingData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ACCOUNT_NOT_APPROVED');
    });

    it('should return error for booking own car', async () => {
      const bookingData = {
        carId: testCar._id.toString(),
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You cannot book your own car');
    });

    it('should return error for conflicting dates', async () => {
      const bookingData = {
        carId: testCar._id.toString(),
        startDate: testBooking.startDate.toISOString(),
        endDate: testBooking.endDate.toISOString(),
      };

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send(bookingData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Car is not available for the selected dates');
      expect(response.body.conflictingBooking).toBeDefined();
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields: carId, startDate, endDate');
    });
  });

  describe('GET /bookings/my', () => {
    it('should get renter bookings successfully', async () => {
      const response = await request(app)
        .get('/bookings/my')
        .set('Authorization', `Bearer ${renterToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].renter.toString()).toBe(renterUser._id.toString());
      expect(response.body.data.bookings[0].car).toBeDefined();
    });

    it('should get owner bookings successfully', async () => {
      const response = await request(app)
        .get('/bookings/my')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].car._id.toString()).toBe(testCar._id.toString());
      expect(response.body.data.bookings[0].renter).toBeDefined();
    });
  });

  describe('GET /bookings/:id', () => {
    it('should get booking by ID successfully', async () => {
      const response = await request(app)
        .get(`/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${renterToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking._id).toBe(testBooking._id.toString());
      expect(response.body.data.booking.car).toBeDefined();
      expect(response.body.data.booking.renter).toBeDefined();
    });

    it('should return error for non-existent booking', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${renterToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Booking not found');
    });
  });

  describe('PUT /bookings/:id/status', () => {
    it('should allow owner to approve booking', async () => {
      const response = await request(app)
        .put(`/bookings/${testBooking._id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'approved' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('approved');
      expect(response.body.message).toBe('Booking status updated successfully');
    });

    it('should allow renter to cancel booking', async () => {
      const response = await request(app)
        .put(`/bookings/${testBooking._id}/status`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send({ status: 'cancelled' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('cancelled');
    });

    it('should prevent renter from approving booking', async () => {
      const response = await request(app)
        .put(`/bookings/${testBooking._id}/status`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send({ status: 'approved' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_STATUS_CHANGE');
    });
  });

  describe('PUT /bookings/:id/cancel', () => {
    it('should cancel booking successfully', async () => {
      const response = await request(app)
        .put(`/bookings/${testBooking._id}/cancel`)
        .set('Authorization', `Bearer ${renterToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('cancelled');
      expect(response.body.message).toBe('Booking cancelled successfully');
    });
  });

  describe('POST /bookings/:id/review', () => {
    beforeEach(async () => {
      // Set booking to completed status for reviews
      testBooking.status = 'completed';
      await testBooking.save();
    });

    it('should add renter review successfully', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Great car and smooth experience!',
      };

      const response = await request(app)
        .post(`/bookings/${testBooking._id}/review`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send(reviewData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.renterReview.rating).toBe(5);
      expect(response.body.data.booking.renterReview.comment).toBe(reviewData.comment);
      expect(response.body.message).toBe('Review added successfully');
    });

    it('should add owner review successfully', async () => {
      const reviewData = {
        rating: 4,
        comment: 'Good renter, returned car in good condition.',
      };

      const response = await request(app)
        .post(`/bookings/${testBooking._id}/review`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(reviewData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.ownerReview.rating).toBe(4);
      expect(response.body.data.booking.ownerReview.comment).toBe(reviewData.comment);
    });
  });
});