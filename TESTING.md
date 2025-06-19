# BorrowMyCar Testing Guide

This document provides comprehensive information about the testing setup and how to run tests for the BorrowMyCar application.

## Testing Stack

### Backend Testing
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library for testing APIs
- **MongoDB Memory Server**: In-memory MongoDB for testing
- **ESM**: ES modules support for modern JavaScript

### Frontend Testing
- **Vitest**: Fast testing framework built on Vite
- **React Testing Library**: Simple and complete testing utilities for React
- **Jest DOM**: Custom Jest matchers for DOM elements
- **JSDOM**: DOM implementation for testing

## Test Structure

```
/tests/                          # Backend tests
├── setup.js                    # Global test setup
├── helpers/
│   └── testHelpers.js          # Test utilities and mocks
├── controllers/                # Controller unit tests
│   ├── authController.test.js
│   ├── carController.test.js
│   └── bookingController.test.js
├── utils/                      # Utility function tests
│   ├── phoneUtils.test.js
│   └── validators.test.js
└── integration/                # Integration tests
    └── carBooking.test.js

/borrowmycarfrontend/src/tests/  # Frontend tests
├── setup.js                    # Frontend test setup
├── components/                 # Component unit tests
│   ├── CarCard.test.jsx
│   └── PhoneInput.test.jsx
└── context/                    # Context/state tests
    └── AuthContext.test.jsx
```

## Running Tests

### Backend Tests

```bash
# Run all backend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/controllers/authController.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="should create user"
```

### Frontend Tests

```bash
# Navigate to frontend directory
cd borrowmycarfrontend

# Run all frontend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run specific test file
npm test -- CarCard.test.jsx
```

### Run All Tests

```bash
# From root directory - run both backend and frontend tests
npm test && cd borrowmycarfrontend && npm test
```

## Test Categories

### 1. Unit Tests

**Controller Tests** (`tests/controllers/`)
- Test individual API endpoints
- Mock external dependencies
- Validate request/response handling
- Test error scenarios

**Utility Tests** (`tests/utils/`)
- Test pure functions
- Validate data transformations
- Test edge cases and error handling

**Component Tests** (`borrowmycarfrontend/src/tests/components/`)
- Test React component rendering
- Test user interactions
- Test prop handling
- Test component state

### 2. Integration Tests

**API Integration** (`tests/integration/`)
- Test complete user workflows
- Test multiple components working together
- Test database interactions
- Test authentication flows

### 3. Context/State Tests

**Authentication Context** (`borrowmycarfrontend/src/tests/context/`)
- Test state management
- Test user authentication flows
- Test localStorage persistence
- Test API integration

## Test Coverage

### Backend Coverage Goals
- Controllers: 90%+ line coverage
- Utils: 95%+ line coverage
- Models: 80%+ line coverage
- Routes: 85%+ line coverage

### Frontend Coverage Goals
- Components: 85%+ line coverage
- Context/Hooks: 90%+ line coverage
- Utils: 95%+ line coverage

## Writing Tests

### Best Practices

1. **Descriptive Test Names**
   ```javascript
   it('should return validation error for invalid email format', () => {
     // Test implementation
   });
   ```

2. **Arrange-Act-Assert Pattern**
   ```javascript
   it('should create booking successfully', async () => {
     // Arrange
     const bookingData = { carId: '123', startDate: '2024-01-01' };
     
     // Act
     const response = await request(app)
       .post('/bookings')
       .send(bookingData);
     
     // Assert
     expect(response.status).toBe(201);
     expect(response.body.success).toBe(true);
   });
   ```

3. **Mock External Dependencies**
   ```javascript
   // Mock Cloudinary uploads
   vi.mock('../utils/cloudUploader.js', () => ({
     uploadImagesToCloud: vi.fn().mockResolvedValue(['image1.jpg']),
   }));
   ```

4. **Clean Up After Tests**
   ```javascript
   afterEach(async () => {
     // Clear database
     await User.deleteMany({});
     await Car.deleteMany({});
   });
   ```

### Test Data Setup

Use the test helpers for consistent test data:

```javascript
import { createTestUser, createTestCar } from '../helpers/testHelpers.js';

const { user, token } = await createTestUser({
  email: 'test@example.com',
  role: 'owner',
  isApproved: true,
});

const car = await createTestCar(user, {
  title: 'Test Car',
  price: 150,
});
```

## Continuous Integration

### GitHub Actions (Recommended)

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # Backend tests
      - run: npm install
      - run: npm test
      
      # Frontend tests
      - run: cd borrowmycarfrontend && npm install
      - run: cd borrowmycarfrontend && npm test
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   ```bash
   # Ensure MongoDB Memory Server is properly installed
   npm install --save-dev mongodb-memory-server
   ```

2. **ESM Import Issues**
   ```javascript
   // Ensure jest.config.js has proper ESM setup
   export default {
     transform: {},
     // ... other config
   };
   ```

3. **Mock Issues**
   ```javascript
   // Use vi.mock() for Vitest, jest.mock() for Jest
   vi.mock('module-name', () => ({
     default: vi.fn(),
   }));
   ```

4. **Async Test Timeouts**
   ```javascript
   // Increase timeout for slow tests
   it('should handle slow operation', async () => {
     // Test implementation
   }, 10000); // 10 second timeout
   ```

### Environment Variables

Create test-specific environment files:

**`.env.test`** (Backend)
```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret
MONGODB_URI=mongodb://localhost:27017/borrowmycar-test
```

**Frontend test environment is handled in test setup files**

## Test Scripts Reference

### Backend
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm test -- --coverage    # With coverage
npm test -- --verbose     # Detailed output
```

### Frontend
```bash
npm test                   # Run all tests  
npm run test:watch        # Watch mode
npm run test:ui           # Visual test UI
npm test -- --reporter=verbose  # Detailed output
```

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Add integration tests for new workflows
5. Update this documentation if needed

For questions about testing, check the existing test files for examples or refer to the documentation for [Jest](https://jestjs.io/) and [Vitest](https://vitest.dev/).