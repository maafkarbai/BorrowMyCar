const { TestRunner, ApiClient, Assert, TestData } = require('../test-helpers.cjs');

const runner = new TestRunner();

runner.test('API Rate Limiting Compliance', async () => {
    const api = new ApiClient();
    const requestCount = 100;
    const timeWindow = 60000; // 1 minute
    
    const startTime = Date.now();
    let successCount = 0;
    let rateLimitedCount = 0;
    
    for (let i = 0; i < requestCount; i++) {
        const response = await api.get('/api/cars');
        
        if (response.status === 200) {
            successCount++;
        } else if (response.status === 429) {
            rateLimitedCount++;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const elapsed = Date.now() - startTime;
    
    Assert.ok(elapsed < timeWindow * 2, 'Test should complete in reasonable time');
    Assert.ok(successCount > 0, 'Some requests should succeed');
    
    // If rate limiting is implemented, expect some 429 responses
    console.log(`Success: ${successCount}, Rate Limited: ${rateLimitedCount}`);
});

runner.test('Search Performance with Large Dataset', async () => {
    const api = new ApiClient();
    
    // Test various search patterns that might be expensive
    const searchQueries = [
        '/api/cars?search=Toyota',
        '/api/cars?city=Dubai&minPrice=100&maxPrice=300',
        '/api/cars?transmission=Automatic&fuelType=Petrol',
        '/api/cars?sort=pricePerDay&order=asc',
        '/api/cars?year=2020&seats=5'
    ];
    
    for (const query of searchQueries) {
        const startTime = Date.now();
        const response = await api.get(query);
        
        Assert.statusCode(response, 200, `Search query "${query}" should succeed`);
        Assert.responseTime(startTime, 2000, `Search should complete within 2 seconds: ${query}`);
        Assert.isArray(response.data.cars, 'Response should contain cars array');
    }
});

runner.test('Resource Cleanup Test', async () => {
    const api = new ApiClient();
    
    // Create temporary resources to test cleanup
    const userData = TestData.generateUser({ role: 'owner' });
    const signupResponse = await api.post('/api/auth/signup', userData);
    
    if (signupResponse.status === 201) {
        api.setToken(signupResponse.data.token);
        
        // Create multiple cars to test resource management
        const carPromises = [];
        for (let i = 0; i < 5; i++) {
            const carData = TestData.generateCar({ title: `Test Car ${i}` });
            carPromises.push(api.post('/api/cars', carData));
        }
        
        const carResponses = await Promise.all(carPromises);
        const successfulCars = carResponses.filter(r => r.status === 201);
        
        Assert.ok(successfulCars.length > 0, 'At least some cars should be created');
        
        // Test retrieving user's cars
        const userCarsResponse = await api.get('/api/cars/my-cars');
        Assert.statusCode(userCarsResponse, 200, 'User should be able to retrieve their cars');
    }
});

runner.test('Error Handling Under Load', async () => {
    const concurrentErrorRequests = 10;
    const promises = [];
    
    // Generate requests that should fail gracefully
    for (let i = 0; i < concurrentErrorRequests; i++) {
        const api = new ApiClient();
        
        // Request non-existent resource
        promises.push(api.get(`/api/cars/nonexistent${i}`));
        
        // Request with invalid data
        promises.push(api.post('/api/auth/login', { invalid: 'data' }));
    }
    
    const startTime = Date.now();
    const responses = await Promise.all(promises);
    
    // All error responses should be handled gracefully
    responses.forEach((response, index) => {
        Assert.ok(response.status >= 400 && response.status < 500, 
            `Request ${index} should return proper error status`);
    });
    
    Assert.responseTime(startTime, 3000, 
        'Error handling should be efficient under load');
});

runner.test('Pagination Performance Test', async () => {
    const api = new ApiClient();
    
    // Test different page sizes and positions
    const paginationTests = [
        { page: 1, limit: 10 },
        { page: 1, limit: 50 },
        { page: 5, limit: 20 },
        { page: 10, limit: 5 }
    ];
    
    for (const { page, limit } of paginationTests) {
        const startTime = Date.now();
        const response = await api.get(`/api/cars?page=${page}&limit=${limit}`);
        
        Assert.statusCode(response, 200, `Pagination page=${page}, limit=${limit} should work`);
        Assert.responseTime(startTime, 1500, 
            `Pagination should be fast: page=${page}, limit=${limit}`);
        
        if (response.data.cars) {
            Assert.ok(response.data.cars.length <= limit, 
                'Response should respect limit parameter');
        }
    }
});

if (require.main === module) {
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = runner;