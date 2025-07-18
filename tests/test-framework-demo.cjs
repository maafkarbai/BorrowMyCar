const { TestRunner, Assert } = require('./test-helpers.cjs');

const runner = new TestRunner();

runner.test('Framework Test - Basic Assertions', async () => {
    Assert.equal(2 + 2, 4, 'Math should work');
    Assert.ok(true, 'True should be truthy');
    Assert.isType('hello', 'string', 'String type check');
});

runner.test('Framework Test - Array Operations', async () => {
    const arr = [1, 2, 3];
    Assert.isArray(arr, 'Should be an array');
    Assert.includes(arr, 2, 'Array should include 2');
    Assert.equal(arr.length, 3, 'Array length should be 3');
});

runner.test('Framework Test - Object Properties', async () => {
    const obj = { name: 'Test', value: 42 };
    Assert.isObject(obj, 'Should be an object');
    Assert.hasProperty(obj, 'name', 'Object should have name property');
    Assert.equal(obj.name, 'Test', 'Name property should match');
});

runner.test('Framework Test - Pattern Matching', async () => {
    const email = 'test@example.com';
    Assert.isValidEmail(email, 'Should be valid email');
    
    const phone = '+971501234567';
    Assert.isValidUAEPhone(phone, 'Should be valid UAE phone');
});

runner.test('Framework Test - Response Time', async () => {
    const startTime = Date.now();
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    Assert.responseTime(startTime, 200, 'Should complete within 200ms');
});

if (require.main === module) {
    runner.run().then(success => {
        console.log('\n🔧 Test Framework Demo Complete');
        process.exit(success ? 0 : 1);
    });
}

module.exports = runner;