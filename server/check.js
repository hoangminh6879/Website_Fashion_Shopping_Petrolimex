import fs from 'fs';
import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost:27017/fashion_shop').then(async () => {
  const db = mongoose.connection.db;
  const products = await db.collection('products').find().toArray();
  const variants = await db.collection('productvariants').find().toArray();
  fs.writeFileSync('out.json', JSON.stringify({products, variants}, null, 2));
  process.exit(0);
});
