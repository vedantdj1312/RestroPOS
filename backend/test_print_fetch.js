async function testFetch() {
  try {
    const res = await fetch('http://localhost:5000/api/tables');
    const tables = await res.json();
    const occupiedTable = tables.find(t => t.status === 'Occupied');
    if (!occupiedTable) {
        console.log('No occupied table found.');
        return;
    }
    console.log('Found occupied table:', occupiedTable.id);
    
    console.log('Fetching active order...');
    const orderRes = await fetch(`http://localhost:5000/api/orders/active/${occupiedTable.id}`);
    if (!orderRes.ok) {
        console.error('Error status:', orderRes.status);
    }
    const orderData = await orderRes.json();
    console.log('Order data:', JSON.stringify(orderData, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  }
}
testFetch();
