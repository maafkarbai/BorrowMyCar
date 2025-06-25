import request from 'supertest';
import express from 'express';
import { 
  createCar, 
  getCars, 
  getCarById, 
  updateCar, 
  deleteCar,
  getMyCars 
} from '../../controllers/carController.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { createTestUser, createTestCar, mockCloudinaryUpload } from '../helpers/testHelpers.js';

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
app.post('/cars', protect, createCar);
app.get('/cars', getCars);
app.get('/cars/my', protect, getMyCars);
app.get('/cars/:id', getCarById);
app.put('/cars/:id', protect, updateCar);
app.delete('/cars/:id', protect, deleteCar);

// Mock Cloudinary
mockCloudinaryUpload();

describe('Car Controller', () => {
  let ownerUser, ownerToken, renterUser, renterToken, testCar;

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

    // Create test car
    testCar = await createTestCar(ownerUser);
  });

  describe('POST /cars', () => {
    it('should create a new car successfully', async () => {
      const carData = {
        title: 'Toyota Camry 2023',
        description: 'Luxury sedan',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        color: 'White',
        pricePerDay: 200,
        transmission: 'Automatic',
        fuelType: 'Petrol',
        seatingCapacity: 5,
        city: 'Dubai',
        plateNumber: 'D12345',
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
      expect(response.body.data.car.pricePerDay).toBe(carData.pricePerDay);
      expect(response.body.data.car.images).toHaveLength(3);
      expect(response.body.message).toBe('Car listed successfully!');
    });

    it('should return error for unapproved user', async () => {
      const { token } = await createTestUser({
        email: 'unapproved@example.com',
        role: 'owner',
        isApproved: false,
      });

      const carData = {
        title: 'Test Car',
        pricePerDay: 100,
      };

      const response = await request(app)
        .post('/cars')
        .set('Authorization', `Bearer ${token}`)
        .send(carData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ACCOUNT_NOT_APPROVED');
    });

    it('should return error for non-owner user', async () => {
      const carData = {
        title: 'Test Car',
        pricePerDay: 100,
      };

      const response = await request(app)
        .post('/cars')
        .set('Authorization', `Bearer ${renterToken}`)
        .send(carData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should return error for invalid price', async () => {
      const carData = {
        title: 'Test Car',
        pricePerDay: -10,
      };

      const response = await request(app)
        .post('/cars')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(carData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_PRICE');
    });
  });

  describe('GET /cars', () => {
    it('should get all cars successfully', async () => {
      const response = await request(app)
        .get('/cars');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cars).toHaveLength(1);
      expect(response.body.data.cars[0].pricePerDay).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter cars by city', async () => {
      // Create a car in different city
      await createTestCar(ownerUser, { city: 'Abu Dhabi' });

      const response = await request(app)
        .get('/cars?city=Dubai');

      expect(response.status).toBe(200);
      expect(response.body.data.cars).toHaveLength(1);
      expect(response.body.data.cars[0].city).toBe('Dubai');
    });

    it('should filter cars by price range', async () => {
      const response = await request(app)
        .get('/cars?priceMin=100&priceMax=200');

      expect(response.status).toBe(200);
      expect(response.body.data.cars).toHaveLength(1);
    });

    it('should search cars by title', async () => {
      const response = await request(app)
        .get('/cars?search=Test Car');

      expect(response.status).toBe(200);
      expect(response.body.data.cars).toHaveLength(1);
    });

    it('should paginate results', async () => {
      // Create more cars
      for (let i = 0; i < 15; i++) {
        await createTestCar(ownerUser, { title: `Car ${i}` });
      }

      const response = await request(app)
        .get('/cars?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.data.cars).toHaveLength(10);
      expect(response.body.data.pagination.totalPages).toBeGreaterThan(1);
      expect(response.body.data.pagination.hasNext).toBe(true);
    });
  });

  describe('GET /cars/:id', () => {
    it('should get a single car successfully', async () => {
      const response = await request(app)
        .get(`/cars/${testCar._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.car._id).toBe(testCar._id.toString());
      expect(response.body.data.car.pricePerDay).toBeDefined();
      expect(response.body.data.car.owner.name).toBeDefined();
    });

    it('should return error for non-existent car', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/cars/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('CAR_NOT_FOUND');
    });
  });

  describe('GET /cars/my', () => {
    it('should get owner cars successfully', async () => {
      const response = await request(app)
        .get('/cars/my')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cars).toHaveLength(1);
      expect(response.body.data.cars[0].bookingStats).toBeDefined();
    });

    it('should return empty for renter', async () => {
      const response = await request(app)
        .get('/cars/my')
        .set('Authorization', `Bearer ${renterToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.cars).toHaveLength(0);
    });
  });

  describe('PUT /cars/:id', () => {
    it('should update car successfully', async () => {
      const updateData = {
        title: 'Updated Car Title',
        price: 250,
      };

      const response = await request(app)
        .put(`/cars/${testCar._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.car.title).toBe(updateData.title);
      expect(response.body.data.car.price).toBe(updateData.price);
    });

    it('should return error for unauthorized user', async () => {
      const updateData = { title: 'Hacked Title' };

      const response = await request(app)
        .put(`/cars/${testCar._id}`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('DELETE /cars/:id', () => {
    it('should delete car successfully', async () => {
      const response = await request(app)
        .delete(`/cars/${testCar._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Car deleted successfully');
    });

    it('should return error for unauthorized user', async () => {
      const response = await request(app)
        .delete(`/cars/${testCar._id}`)
        .set('Authorization', `Bearer ${renterToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });
});