const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ===============================
// OCEAN DELIVERY PLATFORM
// BIG BUILD BACKEND FOUNDATION
// ===============================

// In-memory database for initial deployment.
// Later this can be connected to PostgreSQL/real database.
const db = {
  users: [],
  restaurants: [],
  menuItems: [],
  orders: [],
  riders: [],
  payouts: [],
  refunds: []
};

// ===============================
// HELPERS
// ===============================

function id(prefix) {
  return prefix + "_" + crypto.randomBytes(8).toString("hex");
}

function now() {
  return new Date().toISOString();
}

function commission(amount) {
  return Math.round(Number(amount || 0) * 0.15 * 100) / 100;
}

// ===============================
// HEALTH CHECK
// ===============================

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "OCEAN backend is running",
    version: "Big Build v1"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    service: "OCEAN Delivery Platform",
    time: now()
  });
});

// ===============================
// CUSTOMER AUTH
// ===============================

app.post("/api/auth/register", (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      status: "error",
      message: "Name, email and password are required"
    });
  }

  const exists = db.users.find(
    user => user.email.toLower
