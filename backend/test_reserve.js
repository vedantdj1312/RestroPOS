async function test() {
  try {
    console.log('Testing reservation PATCH...');
    const response = await fetch('http://localhost:5000/api/tables/1/reserve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reserved_at: new Date(2026, 3, 5, 19, 30, 0).toISOString()
      })
    });
    const data = await response.json();
    if (response.ok) {
      console.log('SUCCESS:', data);
    } else {
      console.log('FAILED STATUS:', response.status);
      console.log('FAILED DATA:', data);
    }
  } catch (error) {
    console.error('Error message:', error.message);
  }
  process.exit(0);
}
test();
