import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";


dotenv.config();
connectDB();

const app = express();

app.use(express.json());

app.get("/api", (req, res) => {
  res.send("API OK");
});

app.get("/", (req, res) => {
  res.send("API running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));