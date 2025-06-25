import request from 'supertest';
import express from 'express';
import { signup, login, getProfile } from '../../controllers/authController.js';
import { User } from '../../models/User.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { createTestUser, generateTestToken } from '../helpers/testHelpers.js';

const app = express();
app.use(express.json());

// Mock middleware for file uploads
app.use((req, res, next) => {
  req.files = {};
  next();
});

// Routes
app.post('/auth/signup', signup);
app.post('/auth/login', login);
app.get('/auth/profile', protect, getProfile);

describe('Auth Controller', () => {
  describe('POST /auth/signup', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0501234567',
        password: 'password123',
        role: 'renter',
        drivingLicenseUrl: 'http://example.com/license.jpg',
        emiratesIdUrl: 'http://example.com/emirates_id.jpg',
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.isApproved).toBe(false);
      expect(response.body.message).toContain('Awaiting admin approval');
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        phone: '0501234567',
        password: 'password123',
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.errors).toContain('Please provide a valid email address');
    });

    it('should return validation error for invalid phone number', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123',
        password: 'password123',
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Please provide a valid UAE phone number (e.g., 0501234567)');
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0501234567',
        password: 'password123',
        drivingLicenseUrl: 'http://example.com/license.jpg',
        emiratesIdUrl: 'http://example.com/emirates_id.jpg',
      };

      // Create first user
      await request(app)
        .post('/auth/signup')
        .send(userData);

      // Try to create second user with same email
      const response = await request(app)
        .post('/auth/signup')
        .send({ ...userData, phone: '0509876543' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_EXISTS');
      expect(response.body.message).toBe('Email already registered');
    });

    it('should return error for short password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0501234567',
        password: '123',
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Password must be at least 6 characters long');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await createTestUser({
        email: 'login@example.com',
        password: 'password123',
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('login@example.com');
      expect(response.body.message).toBe('Login successful');
    });

    it('should return error for invalid email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return error for invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return error for missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_CREDENTIALS');
      expect(response.body.message).toBe('Please provide email and password');
    });
  });

  describe('GET /auth/profile', () => {
    it('should get user profile successfully', async () => {
      const { user, token } = await createTestUser({
        email: 'profile@example.com',
        name: 'Profile User',
      });

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('profile@example.com');
      expect(response.body.data.user.name).toBe('Profile User');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return error for missing token', async () => {
      const response = await request(app)
        .get('/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});