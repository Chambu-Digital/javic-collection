const mongoose = require('mongoose');
const Product = require('./models/Product');

async function checkProduct() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/javic');
    const product = await Product.findById('6a54160f2dbf0b3b508645b3');
    console.log('Product data:', JSON.stringify(product.toObject(), null, 2));
    console.log('\nPrice field:', product.price);
    console.log('Price type:', typeof product.price);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProduct();
