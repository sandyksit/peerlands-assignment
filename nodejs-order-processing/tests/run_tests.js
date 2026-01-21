const child = require('child_process');
const path = require('path');
const fetch = require('node-fetch');

const server = child.spawn(process.execPath, [path.join(__dirname, '..', 'src', 'index.js')], { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });

function waitForServer() {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timeout = 5000;
    const check = () => {
      fetch('http://localhost:3000/').then(r => r.json()).then(() => resolve()).catch(err => {
        if (Date.now() - start > timeout) return reject(new Error('server start timeout'));
        setTimeout(check, 200);
      })
    };
    check();
  });
}

async function run() {
  try {
    await waitForServer();
    console.log('server started');

    // Create order
    const createRes = await fetch('http://localhost:3000/orders', { method: 'POST', body: JSON.stringify({ items: [{ productId: 'p1', quantity: 2, price: 3 }] }), headers: { 'Content-Type': 'application/json' } });
    const order = await createRes.json();
    if (!order.id) throw new Error('create failed');

    // Get order
    const getRes = await fetch(`http://localhost:3000/orders/${order.id}`);
    const got = await getRes.json();
    if (got.id !== order.id) throw new Error('get failed');

    console.log('integration tests passed');
  } catch (err) {
    console.error('tests failed', err && err.stack);
    process.exitCode = 2;
  } finally {
    server.kill();
  }
}

run();
