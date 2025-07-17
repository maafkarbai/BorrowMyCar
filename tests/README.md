# BorrowMyCar Test Suite

Comprehensive test suite for the BorrowMyCar application covering usability, security, validation, and performance aspects.

## Test Structure

```
tests/
├── test-helpers.js           # Test utilities and helpers
├── run-all-tests.js         # Main test runner
├── integration/             # Integration tests
│   ├── 01-auth-usability.test.js
│   ├── 02-car-management.test.js
│   └── 03-booking-workflow.test.js
├── security/                # Security tests
│   ├── 04-authentication-security.test.js
│   └── 05-data-security.test.js
├── unit/                    # Unit and validation tests
│   ├── 06-input-validation.test.js
│   └── 07-business-logic-validation.test.js
└── performance/             # Performance tests
    ├── 08-response-time.test.js
    ├── 09-load-testing.test.js
    └── 10-scalability.test.js
```

## Test Categories

### 1. Usability Tests (Integration)
- User registration and authentication
- Car browsing and searching
- Car listing management
- Booking workflow
- API endpoint functionality

### 2. Security Tests
- JWT token security
- SQL/NoSQL injection prevention
- XSS protection
- Password security requirements
- Rate limiting
- Authorization and access control
- Data isolation between users

### 3. Validation Tests
- Email format validation
- UAE phone number validation
- Password strength requirements
- Car data validation
- Booking date validation
- Business logic validation

### 4. Performance Tests
- API response times
- Concurrent user handling
- Load testing
- Database connection pooling
- Search performance
- Pagination efficiency

## Running Tests

### Run All Tests
```bash
cd tests
node run-all-tests.js
```

### Run Individual Test Files
```bash
node integration/01-auth-usability.test.js
node security/04-authentication-security.test.js
node unit/06-input-validation.test.js
node performance/08-response-time.test.js
```

### Run Tests by Category
```bash
# Integration tests
node integration/01-auth-usability.test.js
node integration/02-car-management.test.js
node integration/03-booking-workflow.test.js

# Security tests
node security/04-authentication-security.test.js
node security/05-data-security.test.js

# Validation tests
node unit/06-input-validation.test.js
node unit/07-business-logic-validation.test.js

# Performance tests
node performance/08-response-time.test.js
node performance/09-load-testing.test.js
node performance/10-scalability.test.js
```

## Prerequisites

1. **Backend Server Running**: Ensure the BorrowMyCar backend is running on `http://localhost:5000`
2. **Database Connection**: MongoDB should be connected and accessible
3. **Environment Variables**: Ensure all required environment variables are set

### Start the Backend
```bash
# From the project root
npm run dev
```

## Test Configuration

The test suite uses the `ApiClient` helper to make HTTP requests to the backend API. By default, it connects to `http://localhost:5000`. You can modify the base URL in individual test files if needed.

## Test Data

Tests use the `TestData` helper to generate realistic test data:
- Random user accounts with valid UAE phone numbers
- Car listings with proper validation
- Booking data with correct date ranges

## Expected Results

All tests should pass when:
- Backend is properly configured and running
- Database is accessible
- All validation rules are implemented
- Security measures are in place
- Performance meets requirements

## Performance Benchmarks

- Authentication: < 2 seconds
- Car browsing: < 1.5 seconds
- Car search: < 2 seconds
- Profile access: < 500ms
- Car creation: < 3 seconds

## Security Validations

- Password strength enforcement
- JWT token validation
- Input sanitization (XSS, SQL injection)
- Rate limiting protection
- Role-based access control
- Data isolation between users

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure backend server is running
2. **Database Errors**: Check MongoDB connection
3. **Validation Failures**: Verify all business rules are implemented
4. **Performance Issues**: Check server resources and database indexes

### Debug Mode

Add console logging to individual tests to debug issues:
```javascript
console.log('Response:', response);
console.log('Status:', response.status);
console.log('Data:', response.data);
```

## Contributing

When adding new tests:
1. Use the existing test helpers and patterns
2. Follow the naming convention: `XX-description.test.js`
3. Include proper assertions and error messages
4. Test both success and failure scenarios
5. Update this README if adding new test categories