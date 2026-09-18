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
// ==================================================
// CUSTOMER MODULE - PART 1
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

    const existingUser = db.users.find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message: "Email already registered"
      });
    }

    const customer = {
      id: id("CUS"),
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: "customer",
      address: address || "",
      createdAt: now(),
      updatedAt: now()
    };

    db.users.push(customer);

    res.status(201).json({
      status: "success",
      message: "Customer registered successfully",
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        address: customer.address
      }
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

    const customer = db.users.find(
      user =>
        user.email.toLowerCase() === email.toLowerCase() &&
        user.role === "customer"
    );

    if (!customer || customer.password !== password) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password"
      });
    }

    res.json({
      status: "success",
      message: "Customer login successful",
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        address: customer.address
      }
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
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      address: customer.address,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }
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

  if (name) customer.name = name;
  if (phone) customer.phone = phone;
  if (address !== undefined) customer.address = address;

  customer.updatedAt = now();

  res.json({
    status: "success",
    message: "Customer profile updated",
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      address: customer.address,
      updatedAt: customer.updatedAt
    }
  });
});
// ==================================================
// ORDER MODULE - PART 1
// ==================================================

app.post("/api/orders", (req, res) => {
  try {
    const {
      customerId,
      restaurantId,
      items,
      total,
      paymentMethod = "COD"
    } = req.body;

    if (!customerId || !restaurantId || !items || !total) {
      return res.status(400).json({
        status: "error",
        message: "customerId, restaurantId, items and total are required"
      });
    }

    const order = {
      id: id("ORD"),
      customerId,
      restaurantId,
      items,
      total,
      paymentMethod,
      status: "pending",
      createdAt: now(),
      updatedAt: now()
    };

    db.orders.push(order);

    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      order
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});


// GET ALL ORDERS
app.get("/api/orders", (req, res) => {
  res.json({
    status: "success",
    count: db.orders.length,
    orders: db.orders
  });
});


// GET SINGLE ORDER
app.get("/api/orders/:orderId", (req, res) => {
  const order = db.orders.find(
    o => o.id === req.params.orderId
  );

  if (!order) {
    return res.status(404).json({
      status: "error",
      message: "Order not found"
    });
  }

  res.json({
    status: "success",
    order
  });
});
// ==================================================
// RESTAURANT MODULE
// PART 1 — REGISTER + LIST + DETAILS
// ==================================================

// Register Restaurant
app.post("/api/restaurants", (req, res) => {
  const {
    name,
    ownerName,
    phone,
    address,
    email
  } = req.body;

  if (!name || !ownerName || !phone || !address) {
    return res.status(400).json({
      status: "error",
      message: "name, ownerName, phone and address are required"
    });
  }

  const restaurant = {
    id: id("rest"),
    name,
    ownerName,
    phone,
    email: email || "",
    address,
    status: "pending",
    isOpen: false,
    rating: 0,
    totalOrders: 0,
    createdAt: now()
  };

  db.restaurants.push(restaurant);

  res.status(201).json({
    status: "success",
    message: "Restaurant registered successfully",
    restaurant
  });
});


// Get All Restaurants
app.get("/api/restaurants", (req, res) => {
  res.json({
    status: "success",
    count: db.restaurants.length,
    restaurants: db.restaurants
  });
});


// Get Single Restaurant
app.get("/api/restaurants/:id", (req, res) => {
  const restaurant = db.restaurants.find(
    r => r.id === req.params.id
  );

  if (!restaurant) {
    return res.status(404).json({
      status: "error",
      message: "Restaurant not found"
    });
  }

  res.json({
    status: "success",
    restaurant
  });
});


// Update Restaurant Status
app.patch("/api/restaurants/:id/status", (req, res) => {
  const restaurant = db.restaurants.find(
    r => r.id === req.params.id
  );

  if (!restaurant) {
    return res.status(404).json({
      status: "error",
      message: "Restaurant not found"
    });
  }

  if (req.body.status) {
    restaurant.status = req.body.status;
  }

  if (typeof req.body.isOpen === "boolean") {
    restaurant.isOpen = req.body.isOpen;
  }

  res.json({
    status: "success",
    message: "Restaurant status updated",
    restaurant
  });
});
