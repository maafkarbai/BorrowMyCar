#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestSuite {
    constructor() {
        this.testFiles = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            suites: []
        };
    }

    async findTestFiles() {
        const testDirs = ['integration', 'security', 'unit', 'performance'];
        
        for (const dir of testDirs) {
            const dirPath = path.join(__dirname, dir);
            
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath)
                    .filter(file => file.endsWith('.test.cjs'))
                    .map(file => path.join(dirPath, file));
                
                this.testFiles.push(...files);
            }
        }
        
        console.log(`\n🔍 Found ${this.testFiles.length} test files:`);
        this.testFiles.forEach(file => {
            console.log(`   📄 ${path.relative(__dirname, file)}`);
        });
    }

    async runSingleTest(testFile) {
        return new Promise((resolve) => {
            console.log(`\n🧪 Running ${path.basename(testFile)}...`);
            
            const child = spawn('node', [testFile], {
                stdio: ['inherit', 'pipe', 'pipe'],
                cwd: path.dirname(testFile)
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                process.stdout.write(output);
            });

            child.stderr.on('data', (data) => {
                const error = data.toString();
                stderr += error;
                process.stderr.write(error);
            });

            child.on('close', (code) => {
                const testName = path.basename(testFile, '.test.cjs');
                const success = code === 0;
                
                // Parse results from stdout
                const passedMatch = stdout.match(/(\d+) passed/);
                const failedMatch = stdout.match(/(\d+) failed/);
                
                const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
                const failed = failedMatch ? parseInt(failedMatch[1]) : (success ? 0 : 1);
                
                const result = {
                    name: testName,
                    file: testFile,
                    success,
                    passed,
                    failed,
                    total: passed + failed,
                    output: stdout,
                    errors: stderr
                };

                this.results.suites.push(result);
                this.results.total += result.total;
                this.results.passed += result.passed;
                this.results.failed += result.failed;

                resolve(result);
            });
        });
    }

    async runAllTests() {
        console.log('\n🚀 BorrowMyCar Test Suite Runner');
        console.log('=====================================');
        
        await this.findTestFiles();
        
        if (this.testFiles.length === 0) {
            console.log('\n❌ No test files found!');
            return false;
        }

        const startTime = Date.now();
        
        for (const testFile of this.testFiles) {
            await this.runSingleTest(testFile);
        }
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        this.printSummary(duration);
        
        return this.results.failed === 0;
    }

    printSummary(duration) {
        console.log('\n\n📊 Test Summary');
        console.log('================');
        
        this.results.suites.forEach(suite => {
            const status = suite.success ? '✅' : '❌';
            console.log(`${status} ${suite.name}: ${suite.passed} passed, ${suite.failed} failed`);
        });
        
        console.log('\n📈 Overall Results:');
        console.log(`   Total Tests: ${this.results.total}`);
        console.log(`   Passed: ${this.results.passed}`);
        console.log(`   Failed: ${this.results.failed}`);
        console.log(`   Duration: ${duration.toFixed(2)}s`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log('\n💥 Some tests failed. Check the output above for details.');
        }
        
        console.log('\n📝 Test Categories Coverage:');
        console.log('   ✅ Usability Tests (API endpoints, user workflows)');
        console.log('   ✅ Security Tests (authentication, authorization, data protection)');
        console.log('   ✅ Validation Tests (input validation, business rules)');
        console.log('   ✅ Performance Tests (response times, load handling)');
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                successRate: ((this.results.passed / this.results.total) * 100).toFixed(2)
            },
            suites: this.results.suites.map(suite => ({
                name: suite.name,
                success: suite.success,
                passed: suite.passed,
                failed: suite.failed,
                total: suite.total
            }))
        };
        
        const reportPath = path.join(__dirname, 'test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Test report saved to: ${reportPath}`);
    }
}

// Command line usage
if (require.main === module) {
    const suite = new TestSuite();
    
    suite.runAllTests()
        .then(async (success) => {
            await suite.generateReport();
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('\n💥 Test runner error:', error);
            process.exit(1);
        });
}

module.exports = TestSuite;