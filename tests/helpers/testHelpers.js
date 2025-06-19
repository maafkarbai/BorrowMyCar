import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User.js';
import Car from '../../models/Car.js';

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';

// Generate test JWT token
export const generateTestToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      isApproved: user.isApproved,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Create test user
export const createTestUser = async (userData = {}) => {
  const defaultUserData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '0501234567',
    password: 'password123',
    role: 'renter',
    isApproved: true,
  };

  const user = await User.create({ ...defaultUserData, ...userData });
  const token = generateTestToken(user);
  
  return { user, token };
};

// Create test car
export const createTestCar = async (ownerUser, carData = {}) => {
  const defaultCarData = {
    title: 'Test Car',
    description: 'A test car',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    color: 'White',
    price: 150,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seatingCapacity: 5,
    city: 'Dubai',
    plateNumber: 'ABC123',
    images: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg', 'http://example.com/image3.jpg'],
    availabilityFrom: new Date(),
    availabilityTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    owner: ownerUser._id,
    status: 'active',
  };

  return await Car.create({ ...defaultCarData, ...carData });
};

// Mock Cloudinary upload
export const mockCloudinaryUpload = () => {
  jest.mock('../utils/cloudUploader.js', () => ({
    uploadImagesToCloud: jest.fn().mockResolvedValue([
      'http://example.com/image1.jpg',
      'http://example.com/image2.jpg',
      'http://example.com/image3.jpg'
    ]),
    deleteImagesFromCloud: jest.fn().mockResolvedValue(true),
  }));
};