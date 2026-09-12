const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/*
====================================================
 OCEAN DELIVERY PLATFORM
 REAL BACKEND FOUNDATION
====================================================
*/

// ==================================================
// IN-MEMORY DATABASE
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


// ==================================================
// API HEALTH
// ==================================================

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

    const existingCustomer = customers.find(
      customer =>
        customer.email.toLowerCase() === email.toLowerCase()
    );

    if (existingCustomer) {
      return res.status(409).json({
        status: "error",
        message: "Customer already exists"
      });
    }

    const customer = {
      id: customerId++,
      name,
      email,
      phone,
      password,
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
  const { email, password } = req.body;

  const customer = customers.find(
    user =>
      user.email.toLowerCase() === String(email).toLowerCase() &&
      user.password === password
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
// CREATE RESTAURANT
// ==================================================

app.post("/api/restaurants", (req, res) => {
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
    name,
    phone,
    address,
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

app.get("/api/restaurants/:id", (req
