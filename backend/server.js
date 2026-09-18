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

        res.status(201).json({
      status: "success",
      message: "Order created successfully",
      order
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Order creation failed"
    });
  }
});

// ==================================================
// GET ALL ORDERS
// ==================================================

app.get("/api/orders", (req, res) => {
  res.json({
    status: "success",
    orders: db.orders
  });
});

// ==================================================
// GET CUSTOMER ORDERS
// ==================================================

app.get("/api/orders/customer/:customerId", (req, res) => {
  const orders = db.orders.filter(
    order => order.customerId === req.params.customerId
  );

  res.json({
    status: "success",
    orders
  });
});

// ==================================================
// GET SINGLE ORDER
// ==================================================

app.get("/api/orders/:id", (req, res) => {
  const order = db.orders.find(
    order => order.id === req.params.id
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
// UPDATE ORDER STATUS
// ==================================================

app.put("/api/orders/:id/status", (req, res) => {
  const order = db.orders.find(
    order => order.id === req.params.id
  );

  if (!order) {
    return res.status(404).json({
      status: "error",
      message: "Order not found"
    });
  }

  const { status } = req.body;

  const allowedStatuses = [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "picked_up",
    "on_the_way",
    "delivered",
    "cancelled"
  ];

  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid order status"
    });
  }

  order.status = status;
  order.updatedAt = now();

  db.notifications.push({
    id: id("NOT"),
    userId: order.customerId,
    type: "order_status",
    message: "Your order status is now " + status,
    orderId: order.id,
    createdAt: now(),
    read: false
  });

  res.json({
    status: "success",
    message: "Order status updated",
    order
  });
});

// ==================================================
// CANCEL ORDER
// ==================================================

app.put("/api/orders/:id/cancel", (req, res) => {
  const order = db.orders.find(
    order => order.id === req.params.id
  );

  if (!order) {
    return res.status(404).json({
      status: "error",
      message: "Order not found"
    });
  }

  if (
    order.status === "delivered" ||
    order.status === "cancelled"
  ) {
    return res.status(400).json({
      status: "error",
      message: "Order cannot be cancelled"
    });
  }

  order.status = "cancelled";
  order.updatedAt = now();

  res.json({
    status: "success",
    message: "Order cancelled successfully",
    order
  });
});

// ==================================================
// RESTAURANT MODULE
// ==================================================

// REGISTER RESTAURANT
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
        message: "Restaurant name, email and phone are required"
      });
    }

    const cleanEmail = String(email)
      .trim()
      .toLowerCase();

    const existing = db.restaurants.find(
      restaurant => restaurant.email === cleanEmail
    );

    if (existing) {
      return res.status(409).json({
        status: "error",
        message: "Restaurant email already registered"
      });
    }

    const restaurant = {
      id: id("RES"),
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
      message: "Restaurant registration failed"
    });
  }
});

// ==================================================
// GET ALL RESTAURANTS
// ==================================================

app.get("/api/restaurants", (req, res) => {
  res.json({
    status: "success",
    restaurants: db.restaurants
  });
});

// ==================================================
// GET SINGLE RESTAURANT
// ==================================================

app.get("/api/restaurants/:id", (req, res) => {
  const restaurant = db.restaurants.find(
    restaurant => restaurant.id === req.params.id
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

// ==================================================
// UPDATE RESTAURANT
// ==================================================

app.put("/api/restaurants/:id", (req, res) => {
  const restaurant = db.restaurants.find(
    restaurant => restaurant.id === req.params.id
  );

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

  if (name) {
    restaurant.name = String(name).trim();
  }

  if (phone) {
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
    message: "Restaurant updated successfully",
    restaurant
  });
});

// ==================================================
// RESTAURANT OPEN / CLOSE
// ==================================================

app.put("/api/restaurants/:id/status", (req, res) => {
  const restaurant = db.restaurants.find(
    restaurant => restaurant.id === req.params.id
  );

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
});

// ==================================================
// MENU MODULE
// ==================================================

// ADD MENU ITEM
app.post("/api/restaurants/:restaurantId/menu", (req, res) => {
  try {
    const restaurant = db.restaurants.find(
      restaurant => restaurant.id === req.params.restaurantId
    );

    if (!restaurant) {
      return res.status(404).json({
        status: "error",
        message: "Restaurant not found"
      });
    }

    const {
      name,
      description,
      price,
      category,
      image
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Menu name and price are required"
      });
    }

    const menuItem = {
      id: id("MENU"),
      restaurantId: restaurant.id,
      name: String(name).trim(),
      description: description || "",
      price: Number(price),
      category: category || "Other",
      image: image || "",
      available: true,
      createdAt: now(),
      updatedAt: now()
    };

    db.menuItems.push(menuItem);

    res.status(201).json({
      status: "success",
      message: "Menu item added successfully",
      menuItem
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Menu item creation failed"
    });
  }
});

// ==================================================
// GET RESTAURANT MENU
// ==================================================

app.get("/api/restaurants/:restaurantId/menu", (req, res) => {
  const restaurant = db.restaurants.find(
    restaurant => restaurant.id === req.params.restaurantId
  );

  if (!restaurant) {
    return res.status(404).json({
      status: "error",
      message: "Restaurant not found"
    });
  }

  const menu = db.menuItems.filter(
    item => item.restaurantId === restaurant.id
  );

  res.json({
    status: "success",
    restaurantId: restaurant.id,
    menu
  });
});// ==================================================
// ORDER MODULE
// ==================================================

function getOrderById(orderId) {
  return db.orders.find(order => order.id === orderId);
}

// CREATE ORDER
app.post("/api/orders", (req, res) => {
  try {
    const {
      customerId,
      restaurantId,
      items,
      deliveryAddress,
      paymentMethod
    } = req.body;

    if (!customerId) {
      return res.status(400).json({
        status: "error",
        message: "customerId is required"
      });
    }

    if (!restaurantId) {
      return res.status(400).json({
        status: "error",
        message: "restaurantId is required"
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Order items are required"
      });
    }

    if (!deliveryAddress) {
      return res.status(400).json({
        status: "error",
        message: "deliveryAddress is required"
      });
    }

    let subtotal = 0;

    const orderItems = items.map(item => {
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const itemTotal = price * quantity;

      subtotal += itemTotal;

      return {
        menuItemId: item.menuItemId || null,
        name: item.name || "Food Item",
        price: price,
        quantity: quantity,
        total: itemTotal
      };
    });

    const deliveryFee = 300;
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + serviceFee;

    const order = {
      id: createId("order"),
      customerId,
      restaurantId,
      items: orderItems,
      subtotal,
      deliveryFee,
      serviceFee,
      total,
      paymentMethod: paymentMethod || "COD",
      paymentStatus:
        paymentMethod === "COD" ? "pending" : "pending",
      orderStatus: "placed",
      deliveryAddress,
      riderId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.orders.push(order);

    db.notifications.push({
      id: createId("notification"),
      userId: customerId,
      type: "order",
      message: "Your order has been placed successfully.",
      orderId: order.id,
      createdAt: new Date().toISOString(),
      read: false
    });

    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      order
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create order",
      error: error.message
    });
  }
});


// ==================================================
// GET ALL ORDERS
// ==================================================

app.get("/api/orders", (req, res) => {
  res.json({
    status: "success",
    count: db.orders.length,
    orders: db.orders
  });
});


// ==================================================
// GET SINGLE ORDER
// ==================================================

app.get("/api/orders/:orderId", (req, res) => {
  const order = getOrderById(req.params.orderId);

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
// UPDATE ORDER STATUS
// ==================================================

app.patch("/api/orders/:orderId/status", (req, res) => {
  const order = getOrderById(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      status: "error",
      message: "Order not found"
    });
  }

  const { status } = req.body;

  const allowedStatuses = [
    "placed",
    "confirmed",
    "preparing",
    "ready",
    "picked_up",
    "on_the_way",
    "delivered",
    "cancelled"
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid order status",
      allowedStatuses
    });
  }

  order.orderStatus = status;
  order.updatedAt = new Date().toISOString();

  db.notifications.push({
    id: createId("notification"),
    userId: order.customerId,
    type: "order_status",
    message: "Order status updated to " + status,
    orderId: order.id,
    createdAt: new Date().toISOString(),
    read: false
  });

  res.json({
    status: "success",
    message: "Order status updated",
    order
  });
});


// ==================================================
// CANCEL ORDER
// ==================================================

app.patch("/api/orders/:orderId/cancel", (req, res) => {
  const order = getOrderById(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      status: "error",
      message: "Order not found"
    });
  }

  if (
    ["picked_up", "on_the_way", "delivered"].includes(
      order.orderStatus
    )
  ) {
    return res.status(400).json({
      status: "error",
      message: "Order cannot be cancelled at this stage"
    });
  }

  order.orderStatus = "cancelled";
  order.updatedAt = new Date().toISOString();

  res.json({
    status: "success",
    message: "Order cancelled successfully",
    order
  });
});


// ==================================================
// CUSTOMER ORDERS
// ==================================================

app.get("/api/customers/:customerId/orders", (req, res) => {
  const orders = db.orders.filter(
    order => order.customerId === req.params.customerId
  );

  res.json({
    status: "success",
    count: orders.length,
    orders
  });
});


// ==================================================
// RESTAURANT ORDERS
// ==================================================

app.get("/api/restaurants/:restaurantId/orders", (req, res) => {
  const orders = db.orders.filter(
    order => order.restaurantId === req.params.restaurantId
  );

  res.json({
    status: "success",
    count: orders.length,
    orders
  });
});


// ==================================================
// RIDER ORDERS
// ==================================================

app.get("/api/riders/:riderId/orders", (req, res) => {
  const orders = db.orders.filter(
    order => order.riderId === req.params.riderId
  );

  res.json({
    status: "success",
    count: orders.length,
    orders
  });
});


// ==================================================
// ASSIGN RIDER TO ORDER
// ==================================================

app.patch("/api/orders/:orderId/assign-rider", (req, res) => {
  const order = getOrderById(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      status: "error",
      message: "Order not found"
    });
  }

  const { riderId } = req.body;

  if (!riderId) {
    return res.status(400).json({
      status: "error",
      message: "riderId is required"
    });
  }

  order.riderId = riderId;
  order.updatedAt = new Date().toISOString();

  db.notifications.push({
    id: createId("notification"),
    userId: order.customerId,
    type: "rider_assigned",
    message: "A delivery rider has been assigned to your order.",
    orderId: order.id,
    createdAt: new Date().toISOString(),
    read: false
  });

  res.json({
    status: "success",
    message: "Rider assigned successfully",
    order
  });
});
