const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function run() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@builders.com', password: 'adminpassword123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Login successful');

  const saveRes = await fetch('http://localhost:5000/api/budget-plans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      month: '2026-06',
      allocations: [
        {
          groupName: 'PROMOTIONAL ACTIVITIES',
          source: 'PAPER AD',
          budget: 10000,
          spent: 9000,
          expenses: []
        }
      ]
    })
  });

  console.log('Save response status:', saveRes.status);
  const data = await saveRes.json();
  console.log('Save response body:', data);
}

run().catch(console.error);
