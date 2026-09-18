const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ==================================================
// OCEAN DELIVERY PLATFORM
// BIG BUILD BACKEND v2
// CUSTOMER + RESTAURANT + MENU + ORDER
// RIDER + PAYMENT + REFUND + PAYOUT
// ADMIN + NOTIFICATION
// ==================================================

// ==================================================
// IN-MEMORY DATABASE
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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function getOrder(orderId) {
  return db.orders.find(order => order.id === orderId);
}

function getRestaurant(restaurantId) {
  return db.restaurants.find(
    restaurant => restaurant.id === restaurantId
  );
}

function getCustomer(customerId) {
  return db.users.find(
    user =>
      user.id === customerId &&
      user.role === "customer"
  );
}

function getRider(riderId) {
  return db.riders.find(
    rider => rider.id === riderId
  );
}

function getPayment(paymentId) {
  return db.payments.find(
    payment => payment.id === paymentId
  );
}

function addNotification(
  userId,
  type,
  message,
  orderId = null
) {
  const notification = {
    id: createId("NOT"),
    userId,
    type,
    message,
    orderId,
    read: false,
    createdAt: now()
  };

  db.notifications.push(notification);

  return notification;
}

// ==================================================
// ROOT / HEALTH
// ==================================================

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "OCEAN backend is running",
    version: "Big Build v2"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    service: "OCEAN Delivery Platform",
    version: "Big Build v2",
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
      payouts: db.payouts.length,
      refunds: db.refunds.length,
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
    const {
      name,
      email,
      phone,
      password,
      address
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        status: "error",
        message:
          "Name, email, phone and password are required"
      });
    }

    const cleanEmail =
      String(email).trim().toLowerCase();

    const existing = db.users.find(
      user => user.email === cleanEmail
    );

    if (existing) {
      return res.status(409).json({
        status: "error",
        message: "Email already registered"
      });
    }

    const customer = {
      id: createId("CUS"),
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

    const cleanEmail =
      String(email).trim().toLowerCase();

    const customer = db.users.find(
      user =>
        user.email === cleanEmail &&
        user.role === "customer"
    );

    if (
      !customer ||
      customer.password !== String(password)
    ) {
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

// CUSTOMER PROFILE
app.get("/api/customers/:id", (req, res) => {
  const customer = getCustomer(req.params.id);

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

// UPDATE CUSTOMER
app.put("/api/customers/:id", (req, res) => {
  const customer = getCustomer(req.params.id);

  if (!customer) {
    return res.status(404).json({
      status: "error",
      message: "Customer not found"
    });
  }

  const {
    name,
    phone,
    address
  } = req.body;

  if (name !== undefined) {
    customer.name = String(name).trim();
  }

  if (phone !== undefined) {
    customer.phone = String(phone).trim();
  }

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
// RESTAURANT MODULE
// ==================================================

// RESTAURANT REGISTER
app.post("/api/restaurants/register", (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      ownerName
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        status: "error",
        message:
          "Restaurant name, email and phone are required"
      });
    }

    const cleanEmail =
      String(email).trim().toLowerCase();

    const existing = db.restaurants.find(
      restaurant =>
        restaurant.email === cleanEmail
    );

    if (existing) {
      return res.status(409).json({
        status: "error",
        message:
          "Restaurant email already registered"
      });
    }

    const restaurant = {
      id: createId("RES"),
      name: String(name).trim(),
      email: cleanEmail,
      phone: String(phone).trim(),
      address: address || "",
      ownerName: ownerName || "",
      status: "pending",
      isOpen: false,
      totalOrders: 0,
      rating: 0,
      createdAt: now(),
      updatedAt: now()
    };

    db.restaurants.push(restaurant);

    res.status(201).json({
      status: "success",
      message: "Restaurant registered successfully",
      restaurant
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Restaurant registration failed",
      error: error.message
    });
  }
});

// RESTAURANT LOGIN
app.post("/api/restaurants/login", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      status: "error",
      message: "Email is required"
    });
  }

  const restaurant = db.restaurants.find(
    item =>
      item.email ===
      String(email).trim().toLowerCase()
  );

  if (!restaurant) {
    return res.status(404).json({
      status: "error",
      message: "Restaurant not found"
    });
  }

  res.json({
    status: "success",
    message: "Restaurant login successful",
    restaurant
  });
});

// ALL RESTAURANTS
app.get("/api/restaurants", (req, res) => {
  res.json({
    status: "success",
    count: db.restaurants.length,
    restaurants: db.restaurants
  });
});

// SINGLE RESTAURANT
app.get("/api/restaurants/:id", (req, res) => {
  const restaurant =
    getRestaurant(req.params.id);

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

// UPDATE RESTAURANT
app.put("/api/restaurants/:id", (req, res) => {
  const restaurant =
    getRestaurant(req.params.id);

  if (!restaurant) {
    return res.status(404).json({
      status: "error",
      message: "Restaurant not found"
    });
  }

  const {
    name,
    phone,
    address,
    ownerName
  } = req.body;

  if (name !== undefined) {
    restaurant.name = String(name).trim();
  }

  if (phone !== undefined) {
    restaurant.phone = String(phone).trim();
  }

  if (address !== undefined) {
    restaurant.address = address;
  }

  if (ownerName !== undefined) {
    restaurant.ownerName = ownerName;
  }

  restaurant.updatedAt = now();

  res.json({
    status: "success",
    message: "Restaurant updated",
    restaurant
  });
});

// OPEN / CLOSE RESTAURANT
app.put(
  "/api/restaurants/:id/status",
  (req, res) => {
    const restaurant =
      getRestaurant(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: "error",
        message: "Restaurant not found"
      });
    }

    const { isOpen } = req.body;

    if (typeof isOpen !== "boolean") {
      return res.status(400).json({
        status: "error",
        message: "isOpen must be true or false"
      });
    }

    restaurant.isOpen = isOpen;
    restaurant.updatedAt = now();

    res.json({
      status: "success",
      message: isOpen
        ? "Restaurant is now open"
        : "Restaurant is now closed",
      restaurant
    });
  }
);

// APPROVE RESTAURANT
app.patch(
  "/api/restaurants/:id/approve",
  (req, res) => {
    const restaurant =
      getRestaurant(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: "error",
        message: "Restaurant not found"
      });
    }

    restaurant.status = "approved";
    restaurant.updatedAt = now();

    res.json({
      status: "success",
      message: "Restaurant approved",
      restaurant
    });
  }
);

// ==================================================
// MENU MODULE
// ==================================================

// ADD MENU ITEM
app.post(
  "/api/restaurants/:restaurantId/menu",
  (req, res) => {
    try {
      const restaurant =
        getRestaurant
