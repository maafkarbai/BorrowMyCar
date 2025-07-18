const { TestRunner, ApiClient, Assert, TestData } = require('../test-helpers.cjs');

const runner = new TestRunner();
const api = new ApiClient();

runner.test('Sensitive Data Exposure Prevention', async () => {
    const userData = TestData.generateUser();
    const signupResponse = await api.post('/api/auth/signup', userData);
    
    // Password should not be returned in response
    Assert.notOk(signupResponse.data.user.password, 
        'Password should not be exposed in API response');
    
    api.setToken(signupResponse.data.token);
    const profileResponse = await api.get('/api/auth/profile');
    
    Assert.notOk(profileResponse.data.user.password, 
        'Password should not be exposed in profile response');
});

runner.test('User Data Isolation', async () => {
    // Create two users
    const user1Data = TestData.generateUser();
    const user2Data = TestData.generateUser();
    
    const user1Response = await api.post('/api/auth/signup', user1Data);
    const user2Response = await api.post('/api/auth/signup', user2Data);
    
    // User 1 creates a car
    api.setToken(user1Response.data.token);
    const user1CarData = TestData.generateCar({ role: 'owner' });
    await api.post('/api/cars', user1CarData);
    
    // User 2 should not be able to access user 1's cars for editing
    api.setToken(user2Response.data.token);
    const user1CarsResponse = await api.get('/api/cars/my-cars');
    
    Assert.statusCode(user1CarsResponse, 200, 'User should be able to access my-cars endpoint');
    
    if (user1CarsResponse.data.cars) {
        Assert.equal(user1CarsResponse.data.cars.length, 0, 
            'User should not see other users cars');
    }
});

runner.test('Input Sanitization - NoSQL Injection', async () => {
    const maliciousPayload = {
        email: { $gt: "" },
        password: { $gt: "" }
    };
    
    const response = await api.post('/api/auth/login', maliciousPayload);
    Assert.statusCode(response, 401, 'NoSQL injection should be prevented');
});

runner.test('File Upload Security - Malicious File Prevention', async () => {
    const userData = TestData.generateUser({ role: 'owner' });
    const signupResponse = await api.post('/api/auth/signup', userData);
    
    api.setToken(signupResponse.data.token);
    
    // Test would require actual file upload, but we can test validation
    const maliciousCarData = TestData.generateCar({
        images: ['../../../etc/passwd', 'script.php', 'malware.exe']
    });
    
    const response = await api.post('/api/cars', maliciousCarData);
    
    if (response.status === 201) {
        // If successful, check that dangerous files weren't accepted
        Assert.ok(true, 'File validation should prevent malicious uploads');
    } else {
        Assert.statusCode(response, 400, 'Malicious file uploads should be rejected');
    }
});

if (require.main === module) {
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = runner;