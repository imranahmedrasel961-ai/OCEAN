const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Temporary in-memory database
let orders = [];
let orderId = 1001;

// =========================
// HOME / HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "OCEAN backend is running",
    service: "OCEAN Delivery Platform API"
  });
});

// =========================
// CREATE ORDER
// =========================
app.post("/api/orders", (req, res) => {
  try {
    const {
      customerName,
      phone,
      address,
      items,
      total,
      paymentMethod
    } = req.body;

    if (!customerName || !phone || !address || !items || !total) {
      return res.status(400).json({
        status: "error",
        message: "Missing required order information"
      });
    }

    const order = {
      id: orderId++,
      customerName,
      phone,
      address,
      items,
      total,
      paymentMethod: paymentMethod || "Cash on Delivery",
      status: "pending",
      createdAt: new Date().toISOString()
    };

    orders.push(order);

    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      order
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create order"
    });
  }
});

// =========================
// GET ALL ORDERS
// =========================
app.get("/api/orders", (req, res) => {
  res.json({
    status: "success",
    count: orders.length,
    orders
  });
});

// =========================
// GET SINGLE ORDER
// =========================
app.get("/api/orders/:id", (req, res) => {
  const id = Number(req.params.id);

  const order = orders.find(order => order.id === id);

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

// =========================
// UPDATE ORDER STATUS
// =========================
app.put("/api/orders/:id/status", (req, res) => {
  const id = Number(req.params.id);
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

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid order status"
    });
  }

  const order = orders.find(order => order.id === id);

  if (!order) {
    return res.status(404).json({
      status: "error",
      message: "Order not found"
    });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  res.json({
    status: "success",
    message: "Order status updated",
    order
  });
});

// =========================
// CANCEL ORDER
// =========================
app.delete("/api/orders/:id", (req, res) => {
  const id = Number(req.params.id);

  const order = orders.find(order => order.id === id);

  if (!order) {
    return res.status(404).json({
      status: "error",
      message: "Order not found"
    });
  }

  order.status = "cancelled";
  order.updatedAt = new Date().toISOString();

  res.json({
    status: "success",
    message: "Order cancelled",
    order
  });
});

// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`OCEAN backend running on port ${PORT}`);
});
