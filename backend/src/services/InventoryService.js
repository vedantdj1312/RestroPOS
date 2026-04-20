const db = require('../config/db');

/**
 * Deducts ingredients from inventory for a given order based on SOP recipes.
 * @param {number|string} orderId - The ID of the order to deduct ingredients for.
 * @param {object} [connection] - Optional existing database connection/transaction.
 */
exports.deductIngredientsForOrder = async (orderId, connection = null) => {
  const client = connection || db;
  
  // 1. Check if already deducted to prevent double-deduction
  const [orderRows] = await client.query(
    'SELECT inventory_deducted, status FROM orders WHERE id = ?',
    [orderId]
  );
  
  if (orderRows.length === 0) throw new Error('Order not found');
  if (orderRows[0].inventory_deducted) {
    console.log(`Inventory already deducted for Order #${orderId}. Skipping.`);
    return;
  }

  // 2. Fetch all items in the order and their quantities
  const [orderItems] = await client.query(
    'SELECT menu_item_id, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  );

  if (orderItems.length === 0) {
    console.log(`Order #${orderId} has no items. Nothing to deduct.`);
    return;
  }

  // 3. For each item, find the recipe and deduct
  for (const item of orderItems) {
    // Get recipe from menu_recipes (the SOP source of truth)
    const [recipeIngredients] = await client.query(
      'SELECT inventory_item_id, quantity_required FROM menu_recipes WHERE menu_item_id = ?',
      [item.menu_item_id]
    );

    for (const ingredient of recipeIngredients) {
      const deductionAmount = parseFloat(ingredient.quantity_required) * parseInt(item.quantity);
      
      // Update inventory quantity
      await client.query(
        'UPDATE inventory_items SET quantity = quantity - ? WHERE id = ?',
        [deductionAmount, ingredient.inventory_item_id]
      );

      // Recalculate status for the modified item
      await client.query(`
        UPDATE inventory_items 
        SET status = CASE 
          WHEN quantity <= 0 THEN 'Out of Stock' 
          WHEN quantity <= min_stock THEN 'Low Stock' 
          ELSE 'OK' 
        END 
        WHERE id = ?
      `, [ingredient.inventory_item_id]);
    }
  }

  // 4. Mark as deducted
  await client.query(
    'UPDATE orders SET inventory_deducted = TRUE WHERE id = ?',
    [orderId]
  );
  
  console.log(`Successfully deducted ingredients for Order #${orderId}`);
};
