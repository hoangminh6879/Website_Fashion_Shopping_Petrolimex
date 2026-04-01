import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.model.js';
import Review from './src/models/Review.model.js';
import Shop from './src/models/Shop.model.js';
import { updateShopMetrics } from './src/utils/shopMetrics.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fashion_shop";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB: ", MONGO_URI);

    const products = await Product.find({});
    console.log(`Checking ${products.length} products...`);
    for (const product of products) {
      const reviews = await Review.find({ product: product._id });
      const avg = reviews.length > 0 
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
        : 0;
      
      if (product.rating !== avg) {
        await Product.findByIdAndUpdate(product._id, { rating: avg });
        console.log(`Updated Product [${product.name}]: ${product.rating} -> ${avg}`);
      }
    }

    const shops = await Shop.find({});
    console.log(`Checking ${shops.length} shops...`);
    for (const shop of shops) {
      await updateShopMetrics(shop._id);
      console.log(`Synchronized metrics for Shop [${shop.name}]`);
    }

    console.log("Recalculation complete! All data is now real.");
  } catch (err) {
    console.error("Error during recalculation:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
