const { TestRunner, ApiClient, Assert, TestData } = require('../test-helpers.cjs');

const runner = new TestRunner();
const api = new ApiClient();

runner.test('Email Validation - Invalid Formats', async () => {
    const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        ''
    ];
    
    for (const email of invalidEmails) {
        const userData = TestData.generateUser({ email });
        const response = await api.post('/api/auth/signup', userData);
        
        Assert.statusCode(response, 400, `Invalid email "${email}" should be rejected`);
    }
});

runner.test('Email Validation - Valid Formats', async () => {
    const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org'
    ];
    
    for (const email of validEmails) {
        const userData = TestData.generateUser({ email });
        const response = await api.post('/api/auth/signup', userData);
        
        Assert.ok(response.status === 201 || response.status === 409, 
            `Valid email "${email}" should be accepted or already exist`);
    }
});

runner.test('UAE Phone Number Validation - Invalid Formats', async () => {
    const invalidPhones = [
        '123456789',
        '+1234567890',
        '971123456',
        '+971 12345',
        'notaphonenumber',
        ''
    ];
    
    for (const phone of invalidPhones) {
        const userData = TestData.generateUser({ phone });
        const response = await api.post('/api/auth/signup', userData);
        
        Assert.statusCode(response, 400, `Invalid UAE phone "${phone}" should be rejected`);
    }
});

runner.test('UAE Phone Number Validation - Valid Formats', async () => {
    const validPhones = [
        '+971501234567',
        '971501234567',
        '0501234567',
        '+971 50 123 4567',
        '971-50-123-4567'
    ];
    
    for (const phone of validPhones) {
        const userData = TestData.generateUser({ phone });
        const response = await api.post('/api/auth/signup', userData);
        
        Assert.ok(response.status === 201 || response.status === 409, 
            `Valid UAE phone "${phone}" should be accepted or already exist`);
    }
});

runner.test('Password Validation - Security Requirements', async () => {
    const weakPasswords = [
        'password',
        '123456',
        'abc',
        'PASSWORD',
        'password123',
        '12345678'
    ];
    
    for (const password of weakPasswords) {
        const userData = TestData.generateUser({ password });
        const response = await api.post('/api/auth/signup', userData);
        
        Assert.statusCode(response, 400, `Weak password "${password}" should be rejected`);
    }
});

runner.test('Car Data Validation - Required Fields', async () => {
    const userData = TestData.generateUser({ role: 'owner' });
    const signupResponse = await api.post('/api/auth/signup', userData);
    
    api.setToken(signupResponse.data.token);
    
    const requiredFields = ['title', 'description', 'pricePerDay', 'city'];
    
    for (const field of requiredFields) {
        const carData = TestData.generateCar();
        delete carData[field];
        
        const response = await api.post('/api/cars', carData);
        Assert.statusCode(response, 400, `Missing required field "${field}" should be rejected`);
    }
});

runner.test('Car Data Validation - Price Validation', async () => {
    const userData = TestData.generateUser({ role: 'owner' });
    const signupResponse = await api.post('/api/auth/signup', userData);
    
    api.setToken(signupResponse.data.token);
    
    const invalidPrices = [-10, 0, 'not_a_number', null];
    
    for (const price of invalidPrices) {
        const carData = TestData.generateCar({ pricePerDay: price });
        const response = await api.post('/api/cars', carData);
        
        Assert.statusCode(response, 400, `Invalid price "${price}" should be rejected`);
    }
});

runner.test('Date Validation - Booking Dates', async () => {
    // Create owner and car first
    const ownerData = TestData.generateUser({ role: 'owner' });
    const ownerResponse = await api.post('/api/auth/signup', ownerData);
    
    api.setToken(ownerResponse.data.token);
    const carData = TestData.generateCar();
    const carResponse = await api.post('/api/cars', carData);
    const carId = carResponse.data.car._id;
    
    // Create renter
    const renterData = TestData.generateUser({ role: 'renter' });
    const renterResponse = await api.post('/api/auth/signup', renterData);
    
    api.setToken(renterResponse.data.token);
    
    // Test invalid date combinations
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const invalidBookings = [
        { startDate: pastDate, endDate: futureDate }, // Start date in past
        { startDate: futureDate, endDate: pastDate }, // End before start
        { startDate: 'invalid-date', endDate: futureDate },
        { startDate: '', endDate: futureDate }
    ];
    
    for (const booking of invalidBookings) {
        const bookingData = TestData.generateBooking(carId, booking);
        const response = await api.post('/api/bookings', bookingData);
        
        Assert.statusCode(response, 400, 'Invalid booking dates should be rejected');
    }
});

if (require.main === module) {
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = runner;