const http = require('http');
const https = require('https');
const crypto = require('crypto');

class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log(`\n🧪 Running ${this.tests.length} tests...\n`);
        
        for (const test of this.tests) {
            try {
                await test.fn();
                this.passed++;
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.failed++;
                console.log(`❌ ${test.name}`);
                console.log(`   Error: ${error.message}`);
            }
        }

        console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
}

class ApiClient {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    async request(method, path, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            if (this.token) {
                options.headers.Authorization = `Bearer ${this.token}`;
            }

            const protocol = url.protocol === 'https:' ? https : http;
            
            const req = protocol.request(url, options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const parsed = body ? JSON.parse(body) : {};
                        resolve({
                            status: res.statusCode,
                            data: parsed,
                            headers: res.headers
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: body,
                            headers: res.headers
                        });
                    }
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    async get(path, headers = {}) {
        return this.request('GET', path, null, headers);
    }

    async post(path, data, headers = {}) {
        return this.request('POST', path, data, headers);
    }

    async put(path, data, headers = {}) {
        return this.request('PUT', path, data, headers);
    }

    async delete(path, headers = {}) {
        return this.request('DELETE', path, null, headers);
    }
}

class Assert {
    static equal(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} Expected: ${expected}, Actual: ${actual}`);
        }
    }

    static notEqual(actual, expected, message = '') {
        if (actual === expected) {
            throw new Error(`${message} Expected not equal to: ${expected}`);
        }
    }

    static ok(value, message = '') {
        if (!value) {
            throw new Error(`${message} Expected truthy value, got: ${value}`);
        }
    }

    static notOk(value, message = '') {
        if (value) {
            throw new Error(`${message} Expected falsy value, got: ${value}`);
        }
    }

    static throws(fn, message = '') {
        try {
            fn();
            throw new Error(`${message} Expected function to throw`);
        } catch (error) {
            // Expected to throw
        }
    }

    static async rejects(promise, message = '') {
        try {
            await promise;
            throw new Error(`${message} Expected promise to reject`);
        } catch (error) {
            // Expected to reject
        }
    }

    static includes(array, item, message = '') {
        if (!array.includes(item)) {
            throw new Error(`${message} Expected array to include: ${item}`);
        }
    }

    static isArray(value, message = '') {
        if (!Array.isArray(value)) {
            throw new Error(`${message} Expected array, got: ${typeof value}`);
        }
    }

    static isObject(value, message = '') {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new Error(`${message} Expected object, got: ${typeof value}`);
        }
    }

    static hasProperty(obj, prop, message = '') {
        if (!obj.hasOwnProperty(prop)) {
            throw new Error(`${message} Expected object to have property: ${prop}`);
        }
    }

    static isType(value, type, message = '') {
        if (typeof value !== type) {
            throw new Error(`${message} Expected ${type}, got: ${typeof value}`);
        }
    }

    static matchesPattern(value, pattern, message = '') {
        if (!pattern.test(value)) {
            throw new Error(`${message} Value "${value}" does not match pattern: ${pattern}`);
        }
    }

    static isValidEmail(email, message = '') {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            throw new Error(`${message} Invalid email format: ${email}`);
        }
    }

    static isValidUAEPhone(phone, message = '') {
        const uaePhonePattern = /^(\+971|00971|971)?[0-9]{8,9}$/;
        if (!uaePhonePattern.test(phone.replace(/[\s-]/g, ''))) {
            throw new Error(`${message} Invalid UAE phone format: ${phone}`);
        }
    }

    static responseTime(startTime, maxMs, message = '') {
        const elapsed = Date.now() - startTime;
        if (elapsed > maxMs) {
            throw new Error(`${message} Response time ${elapsed}ms exceeds ${maxMs}ms`);
        }
    }

    static statusCode(response, expectedCode, message = '') {
        if (response.status !== expectedCode) {
            throw new Error(`${message} Expected status ${expectedCode}, got: ${response.status}`);
        }
    }
}

class TestData {
    static generateUser(overrides = {}) {
        return {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: 'TestPassword123!',
            phone: '+971501234567',
            role: 'renter',
            ...overrides
        };
    }

    static generateCar(overrides = {}) {
        return {
            title: 'Test Car',
            description: 'A reliable test car',
            brand: 'Toyota',
            model: 'Camry',
            year: 2020,
            pricePerDay: 150,
            city: 'Dubai',
            fuelType: 'Petrol',
            transmission: 'Automatic',
            seats: 5,
            availabilityFrom: new Date().toISOString(),
            availabilityTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            ...overrides
        };
    }

    static generateBooking(carId, overrides = {}) {
        const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const endDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        
        return {
            carId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalPrice: 450,
            paymentMethod: 'card',
            ...overrides
        };
    }

    static generateRandomString(length = 10) {
        return crypto.randomBytes(length).toString('hex').substring(0, length);
    }
}

module.exports = {
    TestRunner,
    ApiClient,
    Assert,
    TestData
};