import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, name: "puntualia-api" });
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});