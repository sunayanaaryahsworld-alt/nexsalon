import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://127.0.0.1:3001/api/customer/businesses');
    const data = await res.json();
    console.log('SALONS:', data.salons?.map(s => `[${s.id}] ${s.name} (${s.address})`));
    console.log('SPAS:', data.spas?.map(s => `[${s.id}] ${s.name} (${s.address})`));
  } catch (err) {
    console.error('TEST ERROR:', err.message);
  }
}

test();
