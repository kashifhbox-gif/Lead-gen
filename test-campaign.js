const baseUrl = 'http://localhost:3000';

const email = 'admin@example.com';
const password = 'Admin123!';
const searchQuery = 'b2b app developer';

async function runTest() {
  try {
    console.log('1. Fetching CSRF token...');
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const rawCookie = csrfRes.headers.get('set-cookie');
    const csrfCookie = rawCookie ? rawCookie.split(';')[0] : '';
    
    if (!csrfToken) {
      throw new Error("Failed to get CSRF token");
    }

    console.log('2. Authenticating with credentials...');
    const authRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfCookie
      },
      body: new URLSearchParams({
        email,
        password,
        csrfToken,
        redirect: 'false',
        json: 'true',
      })
    });

    const authData = await authRes.json();
    
    if (authData.error) {
      throw new Error(`Authentication failed: ${authData.error}`);
    }
    
    // Extract session cookie
    const setCookieHeaders = authRes.headers.getSetCookie ? authRes.headers.getSetCookie() : [authRes.headers.get('set-cookie')];
    let sessionCookie = '';
    for (const cookie of setCookieHeaders) {
      if (cookie && (cookie.includes('next-auth.session-token') || cookie.includes('__Secure-next-auth.session-token'))) {
        sessionCookie = cookie.split(';')[0];
        break;
      }
    }

    console.log('Successfully logged in! Session token acquired.');

    console.log(`3. Starting a campaign for keyword: "${searchQuery}"...`);
    const jobRes = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({ searchQuery })
    });

    const jobData = await jobRes.json();

    if (jobRes.ok) {
      console.log('✅ Campaign successfully started!');
      console.log('Job details:', jobData);
    } else {
      console.error('❌ Failed to start campaign:', jobData);
    }
  } catch (error) {
    console.error('Test script encountered an error:', error);
  }
}

runTest();
