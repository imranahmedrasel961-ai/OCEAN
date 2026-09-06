const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
res.json({
success: true,
message: "OCEAN Delivery Platform Backend is running!"
});
});

app.get("/api/health", (req, res) => {
res.json({
success: true,
status: "online",
service: "OCEAN Backend"
});
});

app.get("/api", (req, res) => {
res.json({
success: true,
message: "Welcome to OCEAN Delivery Platform API"
});
});

app.listen(PORT, () => {
console.log("OCEAN Backend running on port ${PORT}");
});
