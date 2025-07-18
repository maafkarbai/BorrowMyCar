const { TestRunner, ApiClient, Assert, TestData } = require('../test-helpers.cjs');

const runner = new TestRunner();
const api = new ApiClient();

runner.test('Car Availability Validation', async () => {
    const ownerData = TestData.generateUser({ role: 'owner' });
    const ownerResponse = await api.post('/api/auth/signup', ownerData);
    
    api.setToken(ownerResponse.data.token);
    
    // Create car with specific availability window
    const availabilityFrom = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const availabilityTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const carData = TestData.generateCar({
        availabilityFrom: availabilityFrom.toISOString(),
        availabilityTo: availabilityTo.toISOString()
    });
    
    const carResponse = await api.post('/api/cars', carData);
    Assert.statusCode(carResponse, 201, 'Car should be created with availability window');
    
    const car = carResponse.data.car;
    Assert.equal(new Date(car.availabilityFrom).getTime(), availabilityFrom.getTime(), 
        'Availability start should match');
    Assert.equal(new Date(car.availabilityTo).getTime(), availabilityTo.getTime(), 
        'Availability end should match');
});

runner.test('Booking Outside Availability Window', async () => {
    // Create owner and car
    const ownerData = TestData.generateUser({ role: 'owner' });
    const ownerResponse = await api.post('/api/auth/signup', ownerData);
    
    api.setToken(ownerResponse.data.token);
    
    const availabilityFrom = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const availabilityTo = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    
    const carData = TestData.generateCar({
        availabilityFrom: availabilityFrom.toISOString(),
        availabilityTo: availabilityTo.toISOString()
    });
    
    const carResponse = await api.post('/api/cars', carData);
    const carId = carResponse.data.car._id;
    
    // Create renter
    const renterData = TestData.generateUser({ role: 'renter' });
    const renterResponse = await api.post('/api/auth/signup', renterData);
    
    api.setToken(renterResponse.data.token);
    
    // Try to book outside availability window
    const outsideBooking = TestData.generateBooking(carId, {
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    const bookingResponse = await api.post('/api/bookings', outsideBooking);
    Assert.statusCode(bookingResponse, 400, 'Booking outside availability should be rejected');
});

runner.test('Duplicate Email Registration Prevention', async () => {
    const userData = TestData.generateUser();
    const firstResponse = await api.post('/api/auth/signup', userData);
    
    Assert.statusCode(firstResponse, 201, 'First registration should succeed');
    
    const duplicateResponse = await api.post('/api/auth/signup', userData);
    Assert.statusCode(duplicateResponse, 409, 'Duplicate email should be rejected');
});

runner.test('Role-Based Car Listing Restrictions', async () => {
    const renterData = TestData.generateUser({ role: 'renter' });
    const renterResponse = await api.post('/api/auth/signup', renterData);
    
    api.setToken(renterResponse.data.token);
    
    const carData = TestData.generateCar();
    const carResponse = await api.post('/api/cars', carData);
    
    // Assuming only owners can list cars
    Assert.statusCode(carResponse, 403, 'Renter should not be able to list cars');
});

runner.test('Self-Booking Prevention', async () => {
    const ownerData = TestData.generateUser({ role: 'owner' });
    const ownerResponse = await api.post('/api/auth/signup', ownerData);
    
    api.setToken(ownerResponse.data.token);
    const carData = TestData.generateCar();
    const carResponse = await api.post('/api/cars', carData);
    const carId = carResponse.data.car._id;
    
    // Owner tries to book their own car
    const selfBookingData = TestData.generateBooking(carId);
    const bookingResponse = await api.post('/api/bookings', selfBookingData);
    
    Assert.statusCode(bookingResponse, 400, 'Owner should not be able to book their own car');
});

if (require.main === module) {
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = runner;