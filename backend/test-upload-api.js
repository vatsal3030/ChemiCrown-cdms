const fs = require('fs');

async function run() {
  // 1. Login to get token
  const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@chemicrown.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.token) {
    console.log('Login failed', loginData);
    return;
  }
  const token = loginData.token;
  console.log('Got token');

  // 2. Create dummy image
  fs.writeFileSync('dummy.jpg', 'fake image content');

  // 3. Send upload request
  const FormData = require('form-data');
  const form = new FormData();
  form.append('firstName', 'Vatsal');
  form.append('image', fs.createReadStream('dummy.jpg'));

  const uploadRes = await fetch('http://127.0.0.1:5000/api/auth/profile', {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`
    },
    body: form,
    duplex: 'half'
  });
  
  const uploadData = await uploadRes.json();
  console.log('Upload response:', uploadData);
}

run().catch(console.error);
