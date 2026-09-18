const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ==================================================
// OCEAN DELIVERY PLATFORM
// BIG BUILD BACKEND v1
// CUSTOMER + ORDER + RESTAURANT + RIDER
// PAYMENT + REFUND + ADMIN + NOTIFICATION
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

function addNotification(userId, type, message, orderId = null) {
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
// HEALTH CHECK
// ==================================================

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
    version: "Big Build v1",
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

  if (name) {
    customer.name = String(name).trim();
  }

  if (phone) {
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
      message:
        "Restaurant registered successfully",
      restaurant
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message:
        "Restaurant registration failed"
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
        getRestaurant(req.params.restaurantId);

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
          message:
            "Menu name and price are required"
        });
      }

      const menuItem = {
        id: createId("MENU"),
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
        message:
          "Menu item added successfully",
        menuItem
      });

    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Menu item creation failed"
      });
    }
  }
);

// GET MENU
app.get(
  "/api/restaurants/:restaurantId/menu",
  (req, res) => {
    const restaurant =
      getRestaurant(req.params.restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        status: "error",
        message: "Restaurant not found"
      });
    }

    const menu = db.menuItems.filter(
      item =>
        item.restaurantId === restaurant.id
    );

    res.json({
      status: "success",
      restaurantId: restaurant.id,
      menu
    });
  }
);

// UPDATE MENU ITEM
app.put("/api/menu/:id", (req, res) => {
  const item = db.menuItems.find(
    menu => menu.id === req.params.id
  );

  if (!item) {
    return res.status(404).json({
      status: "error",
      message: "Menu item not found"
    });
  }

  const {
    name,
    description,
    price,
    category,
    image,
    available
  } = req.body;

  if (name !== undefined) {
    item.name = String(name).trim();
  }

  if (description !== undefined) {
    item.description = description;
  }

  if (price !== undefined) {
    item.price = Number(price);
  }

  if (category !== undefined) {
    item.category = category;
  }

  if (image !== undefined) {
    item.image = image;
  }

  if (available !== undefined) {
    item.available = Boolean(available);
  }

  item.updatedAt = now();

  res.json({
    status: "success",
    message: "Menu item updated",
    menuItem: item
  });
});

// DELETE MENU ITEM
app.delete("/api/menu/:id", (req, res) => {
  const index = db.menuItems.findIndex(
    item => item.id === req.params.id
  );

  if (index === -1) {
    return res.status(404).json({
      status: "error",
      message: "Menu item not found"
    });
  }

  const deleted =
    db.menuItems.splice(index, 1)[0];

  res.json({
    status: "success",
    message: "Menu item deleted",
    menuItem: deleted
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

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Order items are required"
      });
    }

    const customer =
      getCustomer(customerId);

    if (!customer) {
      return res.status(404).json({
        status: "error",
        message: "Customer not found"
      });
    }

    const restaurant =
      getRestaurant(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        status: "error",
        message: "Restaurant not found"
      });
    }

    const address =
      deliveryAddress ||
      customer.address ||
      "";

    if (!address) {
      return res.status(400).json({
        status: "error",
        message: "Delivery address is required"
      });
    }

    let subtotal = 0;

    const orderItems = items.map(item => {
      const quantity =
        Number(item.quantity) || 1;

      let price =
        Number(item.price) || 0;

      const menuItemId =
        item.menuItemId || null;

      if (menuItemId) {
        const menuItem =
          db.menuItems.find(
            menu => menu.id === menuItemId
          );

        if (menuItem) {
          price = Number(menuItem.price);
        }
      }

      const itemTotal =
        price * quantity;

      subtotal += itemTotal;

      return {
        menuItemId,
        name: item.name || "Food Item",
        price,
        quantity,
        total: itemTotal
      };
    });

    const deliveryFee = 300;
    const serviceFee =
      Math.round(subtotal * 0.05);

    const total =
      subtotal +
      deliveryFee +
      serviceFee;

    const order = {
      id: createId("ORD"),
      customerId,
      restaurantId,
      riderId: null,
      items: orderItems,
      subtotal,
      deliveryFee,
      serviceFee,
      total,
      commission: commission(total),
      restaurantPayout:
        total - commission(total),
      paymentMethod:
        paymentMethod || "COD",
      paymentStatus: "pending",
      orderStatus: "placed",
      deliveryAddress: address,
      createdAt: now(),
      updatedAt: now()
    };

    db.orders.push(order);

    restaurant.totalOrders =
      Number(restaurant.totalOrders || 0) + 1;

    addNotification(
      customerId,
      "order",
      "Your order has been placed successfully.",
      order.id
    );

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

// ALL ORDERS
app.get("/api/orders", (req, res) => {
  res.json({
    status: "success",
    count: db.orders.length,
    orders: db.orders
  });
});

// SINGLE ORDER
app.get("/api/orders/:orderId", (req, res) => {
  const order =
    getOrder(req.params.orderId);

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

// CUSTOMER ORDERS
app.get(
  "/api/customers/:customerId/orders",
  (req, res) => {
    const orders = db.orders.filter(
      order =>
        order.customerId ===
        req.params.customerId
    );

    res.json({
      status: "success",
      count: orders.length,
      orders
    });
  }
);

// RESTAURANT ORDERS
app.get(
  "/api/restaurants/:restaurantId/orders",
  (req, res) => {
    const orders = db.orders.filter(
      order =>
        order.restaurantId ===
        req.params.restaurantId
    );

    res.json({
      status: "success",
      count: orders.length,
      orders
    });
  }
);

// UPDATE ORDER STATUS
app.patch(
  "/api/orders/:orderId/status",
  (req, res) => {
    const order =
      getOrder(req.params.orderId);

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
    order.updatedAt = now();

    if (status === "delivered") {
      order.paymentStatus =
        order.paymentMethod === "COD"
          ? "paid"
          : order.paymentStatus;
    }

    addNotification(
      order.customerId,
      "order_status",
      "Order status updated to " + status,
      order.id
    );

    res.json({
      status: "success",
      message: "Order status updated",
      order
    });
  }
);

// CANCEL ORDER
app.patch(
  "/api/orders/:orderId/cancel",
  (req, res) => {
    const order =
      getOrder(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found"
      });
    }

    if (
      [
        "picked_up",
        "on_the_way",
        "delivered",
        "cancelled"
      ].includes(order.orderStatus)
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Order cannot be cancelled at this stage"
      });
    }

    order.orderStatus = "cancelled";
    order.updatedAt = now();

    addNotification(
      order.customerId,
      "order_cancelled",
      "Your order has been cancelled.",
      order.id
    );

    res.json({
      status: "success",
      message: "Order cancelled successfully",
      order
    });
  }
);

// ==================================================
// RIDER MODULE
// ==================================================

// RIDER REGISTER
app.post("/api/riders/register", (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      vehicleType,
      vehicleNumber
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        status: "error",
        message:
          "Name, email and phone are required"
      });
    }

    const cleanEmail =
      String(email).trim().toLowerCase();

    const existing =
      db.riders.find(
        rider => rider.email === cleanEmail
      );

    if (existing) {
      return
