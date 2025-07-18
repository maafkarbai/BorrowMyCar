const { TestRunner, ApiClient, Assert, TestData } = require('../test-helpers.cjs');

const runner = new TestRunner();
const api = new ApiClient();

runner.test('Browse Cars - Public Access', async () => {
    const response = await api.get('/api/cars');
    
    Assert.statusCode(response, 200, 'Car browsing should be publicly accessible');
    Assert.isArray(response.data.cars, 'Response should contain cars array');
    Assert.hasProperty(response.data, 'totalPages', 'Response should include pagination info');
});

runner.test('Car Listing - Authenticated Owner', async () => {
    const userData = TestData.generateUser({ role: 'owner' });
    const signupResponse = await api.post('/api/auth/signup', userData);
    
    api.setToken(signupResponse.data.token);
    const carData = TestData.generateCar();
    const carResponse = await api.post('/api/cars', carData);
    
    Assert.statusCode(carResponse, 201, 'Car listing should succeed for authenticated owner');
    Assert.hasProperty(carResponse.data, 'car', 'Response should include car data');
    Assert.equal(carResponse.data.car.title, carData.title, 'Car title should match');
});

runner.test('Car Details - Valid Car ID', async () => {
    const userData = TestData.generateUser({ role: 'owner' });
    const signupResponse = await api.post('/api/auth/signup', userData);
    
    api.setToken(signupResponse.data.token);
    const carData = TestData.generateCar();
    const carResponse = await api.post('/api/cars', carData);
    
    const carId = carResponse.data.car._id;
    const detailsResponse = await api.get(`/api/cars/${carId}`);
    
    Assert.statusCode(detailsResponse, 200, 'Car details should be accessible');
    Assert.hasProperty(detailsResponse.data, 'car', 'Response should include car data');
    Assert.equal(detailsResponse.data.car._id, carId, 'Car ID should match');
});

runner.test('Car Search - Filter by City', async () => {
    const searchResponse = await api.get('/api/cars?city=Dubai');
    
    Assert.statusCode(searchResponse, 200, 'Car search should work');
    Assert.isArray(searchResponse.data.cars, 'Response should contain cars array');
    
    if (searchResponse.data.cars.length > 0) {
        searchResponse.data.cars.forEach(car => {
            Assert.equal(car.city, 'Dubai', 'All cars should be from Dubai');
        });
    }
});

runner.test('Car Search - Filter by Price Range', async () => {
    const searchResponse = await api.get('/api/cars?minPrice=100&maxPrice=200');
    
    Assert.statusCode(searchResponse, 200, 'Price range search should work');
    Assert.isArray(searchResponse.data.cars, 'Response should contain cars array');
    
    if (searchResponse.data.cars.length > 0) {
        searchResponse.data.cars.forEach(car => {
            Assert.ok(car.pricePerDay >= 100 && car.pricePerDay <= 200, 
                'Car price should be within range');
        });
    }
});

if (require.main === module) {
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = runner;