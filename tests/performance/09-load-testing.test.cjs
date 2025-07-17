const { TestRunner, ApiClient, Assert, TestData } = require('../test-helpers.cjs');

const runner = new TestRunner();

runner.test('Concurrent User Registration Load Test', async () => {
    const concurrentUsers = 10;
    const promises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
        const api = new ApiClient();
        const userData = TestData.generateUser();
        promises.push(api.post('/api/auth/signup', userData));
    }
    
    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    
    const successfulResponses = responses.filter(r => r.status === 201 || r.status === 409);
    
    Assert.ok(successfulResponses.length >= concurrentUsers * 0.8, 
        'At least 80% of concurrent registrations should succeed');
    Assert.responseTime(startTime, 5000, 
        'Concurrent registrations should complete within 5 seconds');
});

runner.test('Concurrent Car Browsing Load Test', async () => {
    const concurrentRequests = 20;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
        const api = new ApiClient();
        promises.push(api.get('/api/cars'));
    }
    
    const startTime = Date.now();
    const responses = await Promise.all(promises);
    
    const successfulResponses = responses.filter(r => r.status === 200);
    
    Assert.equal(successfulResponses.length, concurrentRequests, 
        'All concurrent car browsing requests should succeed');
    Assert.responseTime(startTime, 3000, 
        'Concurrent car browsing should complete within 3 seconds');
});

runner.test('Rapid Sequential Requests Test', async () => {
    const api = new ApiClient();
    const requestCount = 50;
    const responses = [];
    
    const startTime = Date.now();
    
    for (let i = 0; i < requestCount; i++) {
        const response = await api.get('/api/cars');
        responses.push(response);
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const endTime = Date.now();
    const avgResponseTime = (endTime - startTime) / requestCount;
    
    const successfulResponses = responses.filter(r => r.status === 200);
    
    Assert.ok(successfulResponses.length >= requestCount * 0.95, 
        'At least 95% of rapid requests should succeed');
    Assert.ok(avgResponseTime < 100, 
        'Average response time should be under 100ms for simple requests');
});

runner.test('Memory Efficiency Test - Large Data Handling', async () => {
    const api = new ApiClient();
    
    // Test with pagination to ensure large datasets are handled efficiently
    const response = await api.get('/api/cars?page=1&limit=100');
    
    Assert.statusCode(response, 200, 'Large data request should succeed');
    Assert.isArray(response.data.cars, 'Response should contain cars array');
    Assert.ok(response.data.cars.length <= 100, 'Pagination should limit results');
    Assert.hasProperty(response.data, 'totalPages', 'Response should include pagination info');
});

runner.test('Database Connection Pool Test', async () => {
    const concurrentDbRequests = 15;
    const promises = [];
    
    // Create multiple users to test database connection pooling
    for (let i = 0; i < concurrentDbRequests; i++) {
        const api = new ApiClient();
        const userData = TestData.generateUser();
        promises.push(api.post('/api/auth/signup', userData));
    }
    
    const startTime = Date.now();
    const responses = await Promise.all(promises);
    
    const successfulResponses = responses.filter(r => r.status === 201 || r.status === 409);
    
    Assert.ok(successfulResponses.length >= concurrentDbRequests * 0.9, 
        'Database should handle concurrent connections efficiently');
    Assert.responseTime(startTime, 4000, 
        'Concurrent database operations should complete within 4 seconds');
});

if (require.main === module) {
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = runner;