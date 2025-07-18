const { TestRunner, ApiClient, Assert, TestData } = require('../test-helpers.cjs');

const runner = new TestRunner();
const api = new ApiClient();

runner.test('User Registration - Valid Data', async () => {
    const userData = TestData.generateUser();
    const response = await api.post('/api/auth/signup', userData);
    
    Assert.statusCode(response, 201, 'Registration should succeed');
    Assert.hasProperty(response.data, 'token', 'Response should include token');
    Assert.hasProperty(response.data, 'user', 'Response should include user data');
    Assert.equal(response.data.user.email, userData.email, 'Email should match');
});

runner.test('User Login - Valid Credentials', async () => {
    const userData = TestData.generateUser();
    await api.post('/api/auth/signup', userData);
    
    const loginResponse = await api.post('/api/auth/login', {
        email: userData.email,
        password: userData.password
    });
    
    Assert.statusCode(loginResponse, 200, 'Login should succeed');
    Assert.hasProperty(loginResponse.data, 'token', 'Login response should include token');
    Assert.hasProperty(loginResponse.data, 'user', 'Login response should include user data');
});

runner.test('User Login - Invalid Credentials', async () => {
    const response = await api.post('/api/auth/login', {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
    });
    
    Assert.statusCode(response, 401, 'Login should fail with invalid credentials');
    Assert.notOk(response.data.token, 'Token should not be provided on failed login');
});

runner.test('Protected Route Access - With Valid Token', async () => {
    const userData = TestData.generateUser();
    const signupResponse = await api.post('/api/auth/signup', userData);
    
    api.setToken(signupResponse.data.token);
    const profileResponse = await api.get('/api/auth/profile');
    
    Assert.statusCode(profileResponse, 200, 'Profile access should succeed with valid token');
    Assert.hasProperty(profileResponse.data, 'user', 'Profile response should include user data');
});

runner.test('Protected Route Access - Without Token', async () => {
    api.setToken(null);
    const profileResponse = await api.get('/api/auth/profile');
    
    Assert.statusCode(profileResponse, 401, 'Profile access should fail without token');
});

if (require.main === module) {
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = runner;