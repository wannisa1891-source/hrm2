async function testAuth() {
  const testUser = {
    name: 'Test Auto User',
    email: `test_auto_${Date.now()}@example.com`,
    password: 'password123'
  };

  console.log('--- 1. Testing Registration ---');
  try {
    const regRes = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const regData = await regRes.json();
    console.log('Register Status:', regRes.status);
    console.log('Register Response:', regData);
  } catch(e) {
    console.error('Failed to connect to backend for Registration (is localhost:3000 running?):', e.message);
    return;
  }

  console.log('\n--- 2. Testing Login ---');
  try {
    const logRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: testUser.email, 
        password: testUser.password 
      })
    });
    const logData = await logRes.json();
    console.log('Login Status:', logRes.status);
    console.log('Login Response:', logData);

    if (logRes.status === 200) {
      console.log('\n✅ TEST PASSED: Authentication flow works perfectly.');
    } else {
      console.log('\n❌ TEST FAILED:', logData);
    }
  } catch(e) {
    console.error('Failed to connect to backend for Login:', e.message);
  }
}

testAuth();
