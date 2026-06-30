const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function getStats() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@builders.com', password: 'adminpassword123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Login successful, token retrieved');

  const statsRes = await fetch('http://localhost:5000/api/dashboard/stats?fromDate=2026-06-01&toDate=2026-06-30', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const statsData = await statsRes.json();
  console.log('Full stats response:', JSON.stringify(statsData, null, 2));
}

getStats().catch(console.error);
