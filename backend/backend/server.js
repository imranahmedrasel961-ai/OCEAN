const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/*
====================================================
 OCEAN DELIVERY PLATFORM
 BACKEND API FOUNDATION
====================================================
*/

const PORT = process.env.PORT || 10000;

// ==================================================
// IN-MEMORY DATABASE
// NOTE: This is the foundation.
// Data resets when the free Render service restarts.
// Production database will be connected later.
// ==================================================

let customers = [];
let restaurants = [];
let riders = [];
let managers = [];
let admins = [];

let orders = [];
let payments = [];
let refunds = [];

let customerId = 1001;
let restaurantId = 2001;
let riderId = 3001;
let managerId = 4001;
let adminId = 5001;
let orderId = 10001;
let paymentId = 6001;
let refundId = 7001;


// ==================================================
// HOME / HEALTH CHECK
// ==================================================

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "OCEAN backend is running",
    service: "OCEAN Delivery Platform API",
    version: "1.0.0"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    server: "online",
    timestamp: new Date().toISOString()
  });
});


// ==================================================
// CUSTOMER SIGNUP
// ==================================================

app.post("/api/customers/signup", (req, res) => {
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
        message: "Name, email, phone and password are required"
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const existingCustomer = customers.find(
      customer => customer.email === cleanEmail
    );

    if (existingCustomer) {
      return res.status(409).json({
        status: "error",
        message: "Customer already exists"
      });
    }

    const customer = {
      id: customerId++,
      name: String(name).trim(),
      email: cleanEmail,
      phone: String(phone).trim(),
      password: String(password),
      address: address || "",
      role: "customer",
      createdAt: new Date().toISOString()
    };

    customers.push(customer);

    res.status(201).json({
      status: "success",
      message: "Customer account created successfully",
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        role: customer.role
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Customer signup failed"
    });
  }
});


// ==================================================
// CUSTOMER LOGIN
// ==================================================

app.post("/api/customers/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required"
      });
    }

    const customer = customers.find(
      user =>
        user.email === String(email).trim().toLowerCase() &&
        user.password === String(password)
    );

    if (!customer) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password"
      });
    }

    res.json({
      status: "success",
      message: "Login successful",
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        role: customer.role
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Login failed"
    });
  }
});


// ==================================================
// GET CUSTOMERS
// ==================================================

app.get("/api/customers", (req, res) => {
  res.json({
    status: "success",
    count: customers.length,
    customers: customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      role: customer.role,
      createdAt: customer.createdAt
    }))
  });
});


// ==================================================
// GET SINGLE CUSTOMER
// ==================================================

app.get("/api/customers/:id", (req, res) => {
  const customer = customers.find(
    item => item.id === Number(req.params.id)
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
      address: customer.address,
      role: customer.role,
      createdAt: customer.createdAt
    }
  });
});


// ==================================================
// CREATE RESTAURANT
// ==================================================

app.post("/api/restaurants", (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      cuisine,
      ownerName
    } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({
        status: "error",
        message: "Restaurant name, phone and address are required"
      });
    }

    const restaurant = {
      id: restaurantId++,
      name: String(name).trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      cuisine: cuisine || "Other",
      ownerName: ownerName || "",
      status: "active",
      menu: [],
      createdAt: new Date().toISOString()
    };

    restaurants.push(restaurant);

    res.status(201).json({
      status: "success",
      message: "Restaurant created successfully",
      restaurant
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Restaurant creation failed"
    });
  }
});


// ==================================================
// GET RESTAURANTS
// ==================================================

app.get("/api/restaurants", (req, res) => {
  res.json({
    status: "success",
    count: restaurants.length,
    restaurants
  });
});


// ==================================================
// GET SINGLE RESTAURANT
// ==================================================

app.get("/api/restaurants/:id", (req, res) => {
  const restaurant = restaurants.find(
    item => item.id === Number(req.params.id)
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
// ADD MENU ITEM
// ==================================================

app.post("/api/restaurants/:id/menu", (req, res) => {
  const restaurant = restaurants.find(
    item => item.id === Number(req.params.id)
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
      message: "Menu item name and price are required"
    });
  }

  const menuItem = {
    id: Date.now(),
    name,
    description: description || "",
    price: Number(price),
    category: category || "Other",
    image: image || "",
    available: true,
    createdAt: new Date().toISOString()
  };

  restaurant.menu.push(menuItem);

  res.status(201).json({
    status: "success",
    message: "Menu item added successfully",
    menuItem
  });
});


// ==================================================
// UPDATE MENU ITEM
// ==================================================

app.put("/api/restaurants/:restaurantId/menu/:menuId", (req, res) => {
  const restaurant = restaurants.find(
    item => item.id === Number(req.params.restaurantId)
  );

  if (!restaurant) {
    return res.status(404).json({
      status: "error",
      message: "Restaurant not found"
    });
  }

  const menuItem = restaurant.menu.find(
    item => item.id === Number(req.params.menuId)
  );

  if (!menuItem) {
    return res.status(404).json({
      status: "error",
      message: "Menu item not found"
    });
  }

  Object.assign(menuItem, {
    name: req.body.name ?? menuItem.name,
    description: req.body.description ?? menuItem.description,
    price: req.body.price !== undefined
      ? Number(req.body.price)
      : menuItem.price,
    category: req.body.category ?? menuItem.category,
    image: req.body.image ?? menuItem.image,
    available: req.body.available ?? menuItem.available
  });

  res.json({
    status: "success",
    message: "Menu item updated successfully",
    menuItem
  });
});


// ==================================================
// DELETE MENU ITEM
// ==================================================

app.delete("/api/restaurants/:restaurantId/menu/:menuId", (req, res) => {
  const restaurant = restaurants.find(
    item => item.id === Number(req.params.restaurantId)
  );

  if (!restaurant) {
    return res.status(404).json({
      status: "error",
      message: "Restaurant not found"
    });
  }

  const index = restaurant.menu.findIndex(
    item => item.id === Number(req.params.menuId)
  );

  if (index === -1) {
    return res.status(404).json({
      status: "error",
      message: "Menu item not found"
    });
  }

  restaurant.menu.splice(index, 1);

  res.json({
    status: "success",
    message: "Menu item deleted successfully"
  });
});


// ==================================================
// RIDER REGISTRATION
// ==================================================

app.post("/api/riders/signup", (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    vehicleType
  } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      status: "error",
      message: "Name, email, phone and password are required"
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  if (riders.some(rider => rider.email === cleanEmail)) {
    return res.status(409).json({
      status: "error",
      message: "Rider already exists"
    });
  }

  const rider = {
    id: riderId++,
    name,
    email: cleanEmail,
    phone,
    password,
    vehicleType: vehicleType || "bicycle",
    status: "available",
    currentOrderId: null,
    createdAt: new Date().toISOString()
  };

  riders.push(rider);

  res.status(201).json({
    status: "success",
    message: "Rider account created successfully",
    rider: {
      id: rider.id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      vehicleType: rider.vehicleType,
      status: rider.status
    }
  });
});


// ==================================================
// RIDER LOGIN
// ==================================================

app.post("/api/riders/login", (req, res) => {
  const { email, password } = req.body;

  const rider = riders.find(
    item =>
      item.email === String(email).trim().toLowerCase() &&
      item.password === String(password)
  );

  if (!rider) {
    return res.status(401).json({
      status: "error",
      message: "Invalid rider email or password"
    });
  }

  res.json({
    status: "success",
    message: "Rider login successful",
    rider: {
      id: rider.id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      vehicleType: rider.vehicleType,
      status: rider.status,
      currentOrderId: rider.currentOrderId
    }
  });
});


// ==================================================
// GET RIDERS
// ==================================================

app.get("/api/riders", (req, res) => {
  res.json({
    status: "success",
    count: riders.length,
    riders: riders.map(rider => ({
      id: rider.id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      vehicleType: rider.vehicleType,
      status: rider.status,
      currentOrderId: rider.currentOrderId,
      createdAt: rider.createdAt
    }))
  });
});


// ==================================================
// RIDER STATUS
// ==================================================

app.put("/api/riders/:id/status", (req, res) => {
  const rider = riders.find(
    item => item.id === Number(req.params.id)
  );

  if (!rider) {
    return res.status(404).json({
      status: "error",
      message: "Rider not found"
    });
  }

  const allowedStatuses = [
    "available",
    "offline",
    "busy"
  ];

  if (!allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid rider status"
    });
  }

  rider.status = req.body.status;

  res.json({
    status: "success",
    message: "Rider status updated",
    rider
  });
});


// ==================================================
// RESTAURANT MANAGER SIGNUP
// ==================================================

app.post("/api/managers/signup", (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    restaurantId: assignedRestaurantId
  } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      status: "error",
      message: "Name, email, phone and password are required"
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  if (managers.some(manager => manager.email === cleanEmail)) {
    return res.status(409).json({
      status: "error",
      message: "Manager already exists"
    });
  }

  const manager = {
    id: managerId++,
    name,
    email: cleanEmail,
