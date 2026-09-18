const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ==================================================
// OCEAN DELIVERY PLATFORM
// BIG BUILD BACKEND
// PART 1 / FOUNDATION + DATABASE
// ==================================================

const db = {
  users: [],
  restaurants: [],
  menuItems: [],
  orders: [],
  riders: [],
  payouts: [],
  refunds: [],
  payments: [],
  notifications: []
};

// ==================================================
// HELPERS
// ==================================================

function createId(prefix) {
  return (
    prefix +
    "_" +
    crypto.randomBytes(8).toString("hex")
  );
}

function now() {
  return new Date().toISOString();
}

function commission(amount) {
  return Math.round(
    Number(amount || 0) * 0.15 * 100
  ) / 100;
}

function safeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    createdAt: user.createdAt
  };
}

// ==================================================
// HEALTH CHECK
// ==================================================

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "OCEAN backend is running",
    version: "Big Build"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    service: "OCEAN Delivery Platform",
    time: now()
  });
});

// ==================================================
// DATABASE STATUS
// ==================================================

app.get("/api/status", (req, res) => {
  res.json({
    status: "success",
    database: "active",
    mode: "backend",
    counts: {
      users: db.users.length,
      restaurants: db.restaurants.length,
      menuItems: db.menuItems.length,
      orders: db.orders.length,
      riders: db.riders.length,
      payments: db.payments.length,
      refunds: db.refunds.length
    },
    time: now()
  });
});

// ==================================================
// CUSTOMER AUTH - REGISTER
// ==================================================

app.post("/api/auth/register", (req, res) => {
  const {
    name,
    email,
    phone,
    password
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      status: "error",
      message: "Name, email and password are required"
    });
  }

  const cleanEmail = String(email)
    .trim()
    .toLowerCase();

  const exists = db.users.find(
    user => user.email === cleanEmail
  );

  if (exists) {
    return res.status(409).json({
      status: "error",
      message: "Email already registered"
    });
  }

  const user = {
    id: createId("user"),
    name: String(name).trim(),
    email: cleanEmail,
    phone: phone || null,
    password: String(password),
    role: "customer",
    createdAt: now()
  };

  db.users.push(user);

  res.status(201).json({
    status: "success",
    message: "Customer registered successfully",
    user: safeUser(user)
  });
});

// ==================================================
// CUSTOMER AUTH - LOGIN
// ==================================================

app.post("/api/auth/login", (req, res) => {
  const {
    email,
    password
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: "error",
      message: "Email and password are required"
    });
  }

  const user = db.users.find(
    item =>
      item.email ===
        String(email).trim().toLowerCase() &&
      item.password === String(password)
  );

  if (!user) {
    return res.status(401).json({
      status: "error",
      message: "Invalid email or password"
    });
  }

  res.json({
    status: "success",
    message: "Login successful",
    user: safeUser(user)
  });
});

// ==================================================
// USER PROFILE
// ==================================================

app.get("/api/users/:id", (req, res) => {
  const user = db.users.find(
    item => item.id === req.params.id
  );

  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "User not found"
    });
  }

  res.json({
    status: "success",
    user: safeUser(user)
  });
});

// ==================================================
// END OF PART 1
// ==================================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`OCEAN backend running on port ${PORT}`);
});
