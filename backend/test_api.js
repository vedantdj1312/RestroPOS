async function test() {
  try {
    // Assuming table 1 has an active order
    // We can iterate tables first to find an occupied or billed one
    const tablesRes = await fetch('http://localhost:5000/api/tables');
    const tables = await tablesRes.json();
    const activeTable = tables.find(t => t.status === 'Occupied' || t.status === 'Billed');
    
    if (!activeTable) {
      console.log('No active tables found');
      return;
    }

    console.log(`Checking active order for Table ${activeTable.table_number} (ID: ${activeTable.id})`);
    const res = await fetch(`http://localhost:5000/api/orders/active/${activeTable.id}`);
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`HTTP Error: ${res.status} ${res.statusText}`);
      console.error(text);
    } else {
      const data = await res.json();
      console.log("Success:", data);
    }
  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}

test();
