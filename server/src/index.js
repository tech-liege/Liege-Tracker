import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import todoRoutes from "./routes/todos.js";
import authRoutes from "./routes/auth.js";
import roadmapRoutes from "./routes/roadmaps.js";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in environment variables.");
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error("Missing JWT_SECRET in environment variables.");
  process.exit(1);
}

app.use(cors({ origin: ["http://localhost:5174", "http://localhost:5173"] }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/roadmaps", roadmapRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).send("Server error");
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch(async (err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
