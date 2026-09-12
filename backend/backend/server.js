const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/*
====================================================
 OCEAN DELIVERY PLATFORM
 COMPLETE BACKEND FOUNDATION
====================================================

 Includes:
 - Customer signup/login
 - Restaurant creation
 - Restaurant menu management
 - Rider signup/login/status
 - Restaurant Manager signup/login
 - Admin signup/login
 - Customer orders
 - Order status tracking
 - Rider assignment
 - Payments structure
 - Refund structure
 - Commission calculation
 - Order history
 - Basic dashboard statistics

 NOTE:
 This version uses IN-MEMORY DATABASE.
 Data resets when the Render service restarts.

 Production upgrade later:
 PostgreSQL / MongoDB
 JWT authentication
 Stripe live payments
 Stripe webhooks
 Secure password hashing
 Real admin authorization
 Persistent sessions
====================================================
*/

const PORT = process.env.PORT || 10000;

// ==================================================
// DATABASE
//
