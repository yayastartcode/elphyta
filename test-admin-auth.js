// Test script to verify admin authentication flow
// Using native fetch API (Node.js 18+)

const BASE_URL = 'http://localhost:3001';

async function testAdminAuth() {
  try {
    console.log('🔍 Testing admin authentication flow...');
    
    // Step 1: Login with admin credentials
    console.log('\n1. Attempting admin login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testadmin@example.com',
        password: 'testadmin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.log('❌ Login failed:', loginData.message);
      return;
    }
    
    const token = loginData.data.token;
    const user = loginData.data.user;
    
    console.log('✅ Login successful');
    console.log('User role:', user.role);
    console.log('Token received:', token ? 'YES' : 'NO');
    
    // Step 2: Test admin stats endpoint
    console.log('\n2. Testing admin stats endpoint...');
    const statsResponse = await fetch(`${BASE_URL}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const statsData = await statsResponse.json();
    console.log('Stats response:', statsData);
    
    if (statsData.success) {
      console.log('✅ Admin stats endpoint working');
    } else {
      console.log('❌ Admin stats failed:', statsData.message);
    }
    
    // Step 3: Test admin users endpoint
    console.log('\n3. Testing admin users endpoint...');
    const usersResponse = await fetch(`${BASE_URL}/admin/users?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const usersData = await usersResponse.json();
    console.log('Users response:', usersData);
    
    if (usersData.success) {
      console.log('✅ Admin users endpoint working');
    } else {
      console.log('❌ Admin users failed:', usersData.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminAuth();