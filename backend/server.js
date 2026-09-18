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
// CUSTOMER + ORDER + RESTAURANT + RIDER + PAYMENT
// ==================================================

const db = {
  users: [],
  restaurants: [],
  menuItems: [],
  orders: [],
  riders: [],
  payments: [],
  payouts: [],
  refunds: [],
  notifications: []
};

// ==================================================
// HELPERS
// ==================================================

function createId(prefix) {
  return prefix + "_" + crypto.randomBytes(8).toString("hex");
}

function id(prefix) {
  return createId(prefix);
}

function now() {
  return new Date().toISOString();
}

function commission(amount) {
  return Math.round(Number(amount || 0) * 0.15 * 100) / 100;
}

function safeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    address: user.address || "",
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
      refunds: db.refunds.length,
      payouts: db.payouts.length,
      notifications: db.notifications.length
    },
    time: now()
  });
});

// ==================================================
// CUSTOMER MODULE
// ==================================================

// CUSTOMER REGISTER
app.post("/api/customers/register", (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        status: "error",
        message: "Name, email, phone and password are required"
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const existingUser = db.users.find(
      user => user.email === cleanEmail
    );

    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message: "Email already registered"
      });
    }

    const customer = {
      id: id("CUS"),
      name: String(name).trim(),
      email: cleanEmail,
      phone: String(phone).trim(),
      password: String(password),
      role: "customer",
      address: address || "",
      createdAt: now(),
      updatedAt: now()
    };

    db.users.push(customer);

    res.status(201).json({
      status: "success",
      message: "Customer registered successfully",
      customer: safeUser(customer)
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Customer registration failed"
    });
  }
});

// CUSTOMER LOGIN
app.post("/api/customers/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required"
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const customer = db.users.find(
      user =>
        user.email === cleanEmail &&
        user.role === "customer"
    );

    if (!customer || customer.password !== String(password)) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password"
      });
    }

    res.json({
      status: "success",
      message: "Customer login successful",
      customer: safeUser(customer)
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Customer login failed"
    });
  }
});

// GET CUSTOMER PROFILE
app.get("/api/customers/:id", (req, res) => {
  const customer = db.users.find(
    user =>
      user.id === req.params.id &&
      user.role === "customer"
  );

  if (!customer) {
    return res.status(404).json({
      status: "error",
      message: "Customer not found"
    });
  }

  res.json({
    status: "success",
    customer: safeUser(customer)
  });
});

// UPDATE CUSTOMER PROFILE
app.put("/api/customers/:id", (req, res) => {
  const customer = db.users.find(
    user =>
      user.id === req.params.id &&
      user.role === "customer"
  );

  if (!customer) {
    return res.status(404).json({
      status: "error",
      message: "Customer not found"
    });
  }

  const { name, phone, address } = req.body;

  if (name) customer.name = String(name).trim();
  if (phone) customer.phone = String(phone).trim();

  if (address !== undefined) {
    customer.address = address;
  }

  customer.updatedAt = now();

  res.json({
    status: "success",
    message: "Customer profile updated",
    customer: safeUser(customer)
  });
});

// ==================================================
// ORDER MODULE
// ==================================================

// CREATE ORDER
app.post("/api/orders", (req, res) => {
  try {
    const {
      customerId,
      restaurantId,
      items,
      total,
      deliveryAddress,
      paymentMethod = "COD"
    } = req.body;

    if (
      !customerId ||
      !restaurantId ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      total === undefined
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "customerId, restaurantId, items and total are required"
      });
    }

    const customer = db.users.find(
      user =>
        user.id === customerId &&
        user.role === "customer"
    );

    if (!customer) {
      return res.status(404).json({
        status: "error",
        message: "Customer not found"
      });
    }

    const restaurant = db.restaurants.find(
      restaurant => restaurant.id === restaurantId
    );

    if (!restaurant) {
      return res.status(404).json({
        status: "error",
        message: "Restaurant not found"
      });
    }

    const order = {
      id: id("ORD"),
      customerId,
      restaurantId,
      riderId: null,
      items,
      total: Number(total),
      deliveryAddress:
        deliveryAddress || customer.address || "",
      paymentMethod,
      paymentStatus:
        paymentMethod === "COD" ? "pending" : "pending",
      status: "pending",
      createdAt: now(),
      updatedAt: now()
    };

    db.orders.push(order);

    restaurant.totalOrders =
      Number(restaurant.totalOrders || 0) + 1;

    res.status(201
