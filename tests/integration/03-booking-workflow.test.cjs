const { TestRunner, ApiClient, Assert, TestData } = require('../test-helpers.cjs');

const runner = new TestRunner();
const api = new ApiClient();

runner.test('Create Booking - Valid Data', async () => {
    // Create owner and car
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
    const bookingData = TestData.generateBooking(carId);
    const bookingResponse = await api.post('/api/bookings', bookingData);
    
    Assert.statusCode(bookingResponse, 201, 'Booking should be created successfully');
    Assert.hasProperty(bookingResponse.data, 'booking', 'Response should include booking data');
    Assert.equal(bookingResponse.data.booking.car, carId, 'Booking should reference correct car');
});

runner.test('View User Bookings', async () => {
    const userData = TestData.generateUser({ role: 'renter' });
    const signupResponse = await api.post('/api/auth/signup', userData);
    
    api.setToken(signupResponse.data.token);
    const bookingsResponse = await api.get('/api/bookings/my-bookings');
    
    Assert.statusCode(bookingsResponse, 200, 'User should be able to view their bookings');
    Assert.isArray(bookingsResponse.data.bookings, 'Response should contain bookings array');
});

runner.test('Booking Conflict Prevention', async () => {
    // Create owner and car
    const ownerData = TestData.generateUser({ role: 'owner' });
    const ownerResponse = await api.post('/api/auth/signup', ownerData);
    
    api.setToken(ownerResponse.data.token);
    const carData = TestData.generateCar();
    const carResponse = await api.post('/api/cars', carData);
    const carId = carResponse.data.car._id;
    
    // Create first renter and booking
    const renter1Data = TestData.generateUser({ role: 'renter' });
    const renter1Response = await api.post('/api/auth/signup', renter1Data);
    
    api.setToken(renter1Response.data.token);
    const booking1Data = TestData.generateBooking(carId);
    await api.post('/api/bookings', booking1Data);
    
    // Create second renter and try overlapping booking
    const renter2Data = TestData.generateUser({ role: 'renter' });
    const renter2Response = await api.post('/api/auth/signup', renter2Data);
    
    api.setToken(renter2Response.data.token);
    const booking2Data = TestData.generateBooking(carId, {
        startDate: booking1Data.startDate,
        endDate: booking1Data.endDate
    });
    const conflictResponse = await api.post('/api/bookings', booking2Data);
    
    Assert.statusCode(conflictResponse, 400, 'Overlapping booking should be rejected');
});

if (require.main === module) {
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = runner;