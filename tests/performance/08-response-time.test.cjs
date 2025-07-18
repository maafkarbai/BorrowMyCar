const { TestRunner, ApiClient, Assert, TestData } = require('../test-helpers.cjs');

const runner = new TestRunner();
const api = new ApiClient();

runner.test('Authentication Response Time', async () => {
    const userData = TestData.generateUser();
    
    const startTime = Date.now();
    const response = await api.post('/api/auth/signup', userData);
    
    Assert.responseTime(startTime, 2000, 'Signup should complete within 2 seconds');
    Assert.statusCode(response, 201, 'Signup should succeed');
    
    const loginStartTime = Date.now();
    const loginResponse = await api.post('/api/auth/login', {
        email: userData.email,
        password: userData.password
    });
    
    Assert.responseTime(loginStartTime, 1000, 'Login should complete within 1 second');
    Assert.statusCode(loginResponse, 200, 'Login should succeed');
});

runner.test('Car Browsing Response Time', async () => {
    const startTime = Date.now();
    const response = await api.get('/api/cars');
    
    Assert.responseTime(startTime, 1500, 'Car browsing should complete within 1.5 seconds');
    Assert.statusCode(response, 200, 'Car browsing should succeed');
});

runner.test('Car Search with Filters Response Time', async () => {
    const startTime = Date.now();
    const response = await api.get('/api/cars?city=Dubai&minPrice=100&maxPrice=500&transmission=Automatic');
    
    Assert.responseTime(startTime, 2000, 'Complex car search should complete within 2 seconds');
    Assert.statusCode(response, 200, 'Car search should succeed');
});

runner.test('User Profile Access Response Time', async () => {
    const userData = TestData.generateUser();
    const signupResponse = await api.post('/api/auth/signup', userData);
    
    api.setToken(signupResponse.data.token);
    
    const startTime = Date.now();
    const profileResponse = await api.get('/api/auth/profile');
    
    Assert.responseTime(startTime, 500, 'Profile access should complete within 500ms');
    Assert.statusCode(profileResponse, 200, 'Profile access should succeed');
});

runner.test('Car Creation Response Time', async () => {
    const userData = TestData.generateUser({ role: 'owner' });
    const signupResponse = await api.post('/api/auth/signup', userData);
    
    api.setToken(signupResponse.data.token);
    const carData = TestData.generateCar();
    
    const startTime = Date.now();
    const carResponse = await api.post('/api/cars', carData);
    
    Assert.responseTime(startTime, 3000, 'Car creation should complete within 3 seconds');
    
    if (carResponse.status === 201) {
        Assert.statusCode(carResponse, 201, 'Car creation should succeed');
    }
});

if (require.main === module) {
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = runner;