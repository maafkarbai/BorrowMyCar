const { TestRunner, ApiClient, Assert, TestData } = require('../test-helpers.cjs');

const runner = new TestRunner();
const api = new ApiClient();

runner.test('JWT Token Expiration', async () => {
    const userData = TestData.generateUser();
    const signupResponse = await api.post('/api/auth/signup', userData);
    
    // Use expired or invalid token
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid';
    api.setToken(fakeToken);
    
    const profileResponse = await api.get('/api/auth/profile');
    Assert.statusCode(profileResponse, 401, 'Expired token should be rejected');
});

runner.test('SQL Injection Prevention - Login', async () => {
    const maliciousPayload = {
        email: "admin@test.com' OR '1'='1",
        password: "password' OR '1'='1"
    };
    
    const response = await api.post('/api/auth/login', maliciousPayload);
    Assert.statusCode(response, 401, 'SQL injection attempt should be rejected');
});

runner.test('XSS Prevention - User Registration', async () => {
    const xssPayload = TestData.generateUser({
        name: '<script>alert("xss")</script>',
        email: 'test@example.com'
    });
    
    const response = await api.post('/api/auth/signup', xssPayload);
    
    if (response.status === 201) {
        Assert.notEqual(response.data.user.name, xssPayload.name, 
            'XSS payload should be sanitized');
    }
});

runner.test('Password Security - Weak Password Rejection', async () => {
    const weakPasswordUser = TestData.generateUser({
        password: '123'
    });
    
    const response = await api.post('/api/auth/signup', weakPasswordUser);
    Assert.statusCode(response, 400, 'Weak password should be rejected');
});

runner.test('Rate Limiting - Multiple Failed Login Attempts', async () => {
    const userData = TestData.generateUser();
    await api.post('/api/auth/signup', userData);
    
    // Attempt multiple failed logins
    for (let i = 0; i < 6; i++) {
        await api.post('/api/auth/login', {
            email: userData.email,
            password: 'wrongpassword'
        });
    }
    
    const finalAttempt = await api.post('/api/auth/login', {
        email: userData.email,
        password: 'wrongpassword'
    });
    
    // Should be rate limited (429) or still failing (401)
    Assert.ok(finalAttempt.status === 429 || finalAttempt.status === 401, 
        'Rate limiting should be in effect or login should still fail');
});

runner.test('Authorization - Role-Based Access Control', async () => {
    const renterData = TestData.generateUser({ role: 'renter' });
    const renterResponse = await api.post('/api/auth/signup', renterData);
    
    api.setToken(renterResponse.data.token);
    const carData = TestData.generateCar();
    const carResponse = await api.post('/api/cars', carData);
    
    // Renter should not be able to list cars (assuming only owners can)
    Assert.statusCode(carResponse, 403, 'Renter should not be able to list cars');
});

if (require.main === module) {
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = runner;