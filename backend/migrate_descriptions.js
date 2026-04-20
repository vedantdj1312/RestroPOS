const db = require('./src/config/db.js');

async function run() {
  try {
    console.log("Adding descriptions to all menu items...");

    const descriptions = {
      // Starters
      'Chicken Tikka': 'Juicy chicken chunks marinated in yogurt & spices, grilled in tandoor to smoky perfection.',
      'Paneer Tikka': 'Cottage cheese cubes with bell peppers, marinated in tandoori spices and chargrilled.',
      'Chicken Wings': 'Crispy fried wings tossed in a bold, tangy sauce. A crowd-favourite appetizer.',
      'Hara Bhara Kabab': 'Spinach and pea patties with aromatic herbs. Crispy outside, soft and flavorful inside.',
      'Fish Amritsari': 'Boneless fish fillets in a spiced chickpea batter, deep-fried to a golden crunch.',
      'Veg Spring Roll': 'Crispy rolls stuffed with seasoned mixed vegetables. Light, crunchy, and delicious.',
      'Tandoori Prawns': 'King prawns marinated in tandoori masala and grilled. Rich, smoky, and succulent.',
      'Crispy Corn': 'Golden corn kernels tossed with spices and curry leaves. A quick, addictive snack.',

      // Main Course
      'Butter Chicken': 'Tender chicken in a creamy, tomato-based gravy with butter and aromatic spices.',
      'Dal Makhani': 'Slow-cooked black lentils in a rich, buttery gravy. A North Indian classic comfort dish.',
      'Kadai Paneer': 'Paneer cubes cooked with capsicum and onions in a kadai-style spicy masala.',
      'Chicken Tikka Masala': 'Grilled chicken tikka pieces simmered in a rich, spiced tomato-onion gravy.',
      'Mutton Curry': 'Slow-braised mutton in a deeply spiced onion-tomato curry. Tender and aromatic.',
      'Palak Paneer': 'Fresh spinach puree with soft paneer cubes, tempered with garlic and cumin.',
      'Paneer Butter Masala': 'Paneer in a smooth, creamy tomato-cashew gravy with a hint of sweetness.',
      'Paneer Masala': 'Cottage cheese cubes in a thick, spiced onion-tomato masala. Rich and hearty.',
      'Kaju Paneer': 'Paneer and cashews in a mild, creamy gravy with a touch of saffron luxuriousness.',
      'Egg Curry': 'Boiled eggs simmered in a flavourful onion-tomato masala. Simple yet satisfying.',
      'Shahi Paneer': 'Royal-style paneer in a creamy cashew-almond gravy with mild, aromatic spices.',
      'Chicken Korma': 'Chicken cooked in a rich yogurt and nut-based gravy. Mild, creamy, and aromatic.',

      // Breads
      'Butter Naan': 'Soft, fluffy tandoor bread brushed with melted butter. Perfect with any curry.',
      'Garlic Naan': 'Tandoor-baked naan topped with fresh garlic and coriander. Fragrant and delicious.',
      'Laccha Paratha': 'Layered, flaky paratha with a crisp exterior. Great for scooping up rich gravies.',
      'Paratha': 'Whole wheat flatbread cooked on a griddle with a touch of ghee. Simple and classic.',
      'Tandoori Roti': 'Whole wheat bread baked in the tandoor. Light, healthy, and pairs with everything.',
      'Cheese Naan': 'Soft naan stuffed with melted cheese. Gooey, indulgent, and a family favourite.',
      'Missi Roti': 'Gram flour flatbread with onions and spices. Rustic, nutritious, and full of flavour.',

      // Rice & Biryani
      'Chicken Biryani': 'Fragrant basmati rice layered with spiced chicken, slow-cooked with saffron & herbs.',
      'Mutton Biryani': 'Tender mutton pieces layered with aromatic rice and cooked dum-style to perfection.',
      'Veg Biryani': 'Mixed vegetables and basmati rice cooked with whole spices and fresh herbs.',
      'Jeera Rice': 'Basmati rice tempered with cumin seeds and ghee. Light and aromatic side dish.',
      'Steamed Rice': 'Plain steamed basmati rice. A clean, fluffy base for any curry or dal.',
      'Egg Fried Rice': 'Fluffy rice stir-fried with scrambled eggs, vegetables, and soy sauce.',
      'Paneer Pulao': 'Basmati rice cooked with paneer cubes, peas, and mild whole spices.',

      // Beverages
      'Cold Coffee': 'Chilled blended coffee with milk and ice cream. Creamy, rich, and refreshing.',
      'Fresh Lime Soda': 'Freshly squeezed lime with soda and a hint of mint. Sweet, salty, or mixed.',
      'Mango Lassi': 'Thick, creamy yogurt shake blended with real Alphonso mango pulp.',
      'Masala Chai': 'Traditional Indian spiced tea brewed with ginger, cardamom, and fresh milk.',
      'Pineapple Juice': 'Freshly extracted pineapple juice. Sweet, tangy, and naturally refreshing.',
      'Buttermilk': 'Spiced yogurt drink with cumin and coriander. Cool, light, and great for digestion.',
      'Mojito': 'Refreshing virgin mojito with fresh mint, lime, and a splash of soda.',
      'Watermelon Juice': 'Freshly blended watermelon juice. Naturally sweet and incredibly hydrating.',

      // Desserts
      'Gulab Jamun': 'Soft, golden milk-solid dumplings soaked in warm rose-cardamom sugar syrup.',
      'Ice Cream': 'Creamy scoops of premium ice cream. Choose from vanilla, chocolate, or mango.',
      'Kulfi': 'Traditional Indian frozen dessert with pistachios and cardamom. Dense and creamy.',
      'Rasmalai': 'Soft paneer discs soaked in chilled saffron-cardamom milk. Delicately sweet.',
      'Gajar Ka Halwa': 'Grated carrots slow-cooked in milk, ghee, and sugar. Topped with dry fruits.',
      'Brownie with Ice Cream': 'Warm chocolate brownie topped with a scoop of vanilla ice cream and drizzle.',

      // Combos
      'Thali - Veg': 'Complete veg meal: dal, paneer, sabzi, rice, roti, salad, and dessert.',
      'Thali - Non Veg': 'Full non-veg meal: chicken curry, dal, rice, naan, salad, and dessert.',
      'Biryani Combo': 'Chicken biryani with raita, salan gravy, and a refreshing beverage included.',
      'Family Pack Veg': 'Serves 4: two curries, dal, rice, rotis, salad, and dessert. Perfect for sharing.',

      // Chinese
      'Veg Manchurian': 'Crispy veggie balls tossed in a tangy, garlicky soy-based Manchurian sauce.',
      'Chicken Manchurian': 'Tender chicken pieces in a spicy, tangy Indo-Chinese Manchurian gravy.',
      'Veg Fried Rice': 'Wok-tossed rice with mixed vegetables, soy sauce, and a hint of sesame.',
      'Hakka Noodles': 'Stir-fried noodles with fresh vegetables in a savoury soy-chilli sauce.',
      'Chicken Noodles': 'Egg noodles stir-fried with chicken strips and vegetables in a spicy sauce.',
      'Paneer Chilli': 'Crispy paneer cubes tossed with peppers and onions in a spicy chilli sauce.',
      'Dragon Chicken': 'Crispy fried chicken in a fiery, sweet-sour dragon sauce. Bold and addictive.'
    };

    for (const [name, desc] of Object.entries(descriptions)) {
      const [result] = await db.query(
        'UPDATE menu_items SET description = ? WHERE name = ?',
        [desc, name]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✓ ${name}`);
      } else {
        console.log(`  ✗ ${name} (not found)`);
      }
    }

    console.log("\nAll descriptions added successfully.");
  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    process.exit(0);
  }
}
run();
