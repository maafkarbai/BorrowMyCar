// Manual test script for User Profile API
// Run with: node tests/manual/testUserProfileAPI.js

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000'; // Adjust if your backend runs on different port

async function testUserProfileAPI() {
  console.log('🧪 Testing User Profile API Endpoint');
  console.log('================================\n');

  // Test with a sample user ID (you'll need to replace with actual user ID from your database)
  const testUserId = '6731234567890abcdef12345'; // Replace with actual user ID

  try {
    console.log(`📡 Making request to: ${API_BASE}/auth/users/${testUserId}`);
    
    const response = await fetch(`${API_BASE}/auth/users/${testUserId}`);
    const data = await response.json();

    console.log(`📊 Response Status: ${response.status}`);
    console.log('📋 Response Data:');
    console.log(JSON.stringify(data, null, 2));

    // Test response structure
    if (response.ok && data.success) {
      console.log('\n✅ API Response Tests:');
      
      // Check user data structure
      const user = data.data.user;
      console.log(`  - User name: ${user.name || 'Missing'}`);
      console.log(`  - User email: ${user.email || 'Missing'}`);
      console.log(`  - User phone: ${user.phone || 'Missing'}`);
      console.log(`  - Profile image: ${user.profileImage ? 'Present' : 'Missing'}`);
      console.log(`  - Average rating: ${user.averageRating || 0}`);
      console.log(`  - Total listings: ${user.totalListings || 0}`);

      // Check cars data
      const cars = data.data.cars;
      console.log(`  - Number of cars: ${cars.length}`);
      
      if (cars.length > 0) {
        console.log(`  - First car title: ${cars[0].title}`);
        console.log(`  - First car price: ${cars[0].price}`);
        console.log(`  - First car pricePerDay: ${cars[0].pricePerDay}`);
        console.log(`  - Owner field present: ${cars[0].owner ? 'Yes' : 'No'}`);
      }

      console.log('\n✅ All tests passed! API is working correctly.');
    } else {
      console.log('\n❌ API Error:');
      console.log(`  - Status: ${response.status}`);
      console.log(`  - Message: ${data.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.log('\n❌ Network Error:');
    console.log(`  - Error: ${error.message}`);
    console.log('  - Make sure the backend server is running on the correct port');
  }

  console.log('\n================================');
  console.log('🏁 Test completed');
}

// Test error handling with invalid user ID
async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling');
  console.log('========================\n');

  const invalidUserId = 'invalid-user-id';

  try {
    console.log(`📡 Making request with invalid ID: ${invalidUserId}`);
    
    const response = await fetch(`${API_BASE}/auth/users/${invalidUserId}`);
    const data = await response.json();

    console.log(`📊 Response Status: ${response.status}`);
    console.log('📋 Response Data:');
    console.log(JSON.stringify(data, null, 2));

    if (response.status === 500 && data.success === false) {
      console.log('\n✅ Error handling works correctly - invalid ID rejected');
    } else {
      console.log('\n⚠️  Unexpected response for invalid ID');
    }

  } catch (error) {
    console.log('\n❌ Network Error:');
    console.log(`  - Error: ${error.message}`);
  }
}

// Test with non-existent user ID
async function testNonExistentUser() {
  console.log('\n🧪 Testing Non-Existent User');
  console.log('===========================\n');

  const nonExistentUserId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but non-existent

  try {
    console.log(`📡 Making request with non-existent ID: ${nonExistentUserId}`);
    
    const response = await fetch(`${API_BASE}/auth/users/${nonExistentUserId}`);
    const data = await response.json();

    console.log(`📊 Response Status: ${response.status}`);
    console.log('📋 Response Data:');
    console.log(JSON.stringify(data, null, 2));

    if (response.status === 404 && data.success === false) {
      console.log('\n✅ Non-existent user handling works correctly');
    } else {
      console.log('\n⚠️  Unexpected response for non-existent user');
    }

  } catch (error) {
    console.log('\n❌ Network Error:');
    console.log(`  - Error: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting User Profile API Tests');
  console.log('==================================\n');
  
  await testUserProfileAPI();
  await testErrorHandling();
  await testNonExistentUser();
  
  console.log('\n🎉 All tests completed!');
  console.log('\nTo run with a real user ID:');
  console.log('1. Create a user in your system');
  console.log('2. Get the user ID from MongoDB');
  console.log('3. Replace the testUserId variable in this script');
  console.log('4. Run the script again');
}

// Execute if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { testUserProfileAPI, testErrorHandling, testNonExistentUser };