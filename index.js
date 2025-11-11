const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// index.js
const decoded = Buffer.from(
  process.env.FIREBASE_SERVICE_KEY,
  "base64"
).toString("utf8");
const serviceAccount = JSON.parse(decoded);

// Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware
app.use(express.json());
app.use(cors());

// Verify Token Middleware
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res
        .status(401)
        .json({ success: false, message: "Authorization header missing" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Token missing" });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_ADMIN}:${process.env.DB_PASSWORD}@cluster0.egeojdc.mongodb.net/?appName=Cluster`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const DB = client.db("rentWheelsDB");
const carsCollection = DB.collection("cars");
const bookingCollection = DB.collection("booking");

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Connected Successfully");

    // Update car status (PATCH)
    app.patch("/cars/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { status } };
        const result = await carsCollection.updateOne(filter, updateDoc);
        res
          .status(200)
          .send({ success: true, message: "Status updated", result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to update status" });
      }
    });

    // Update car (PUT)
    app.put("/cars/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = req.body;
        const result = await carsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        res.status(200).send({ success: true, message: "Car updated", result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: "Update failed" });
      }
    });

    // Get all cars  by provider email
    app.get("/cars", async (req, res) => {
      try {
        const query = {};
        const providerEmail = req.query.ProviderEmail;
        if (providerEmail) query.providerEmail = providerEmail;

        const cars = await carsCollection
          .find(query)
          .sort({ createdAt: 1 })
          .toArray();
        res.send(cars);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to get cars" });
      }
    });

    // Get latest cars
    app.get("/latest-cars", async (req, res) => {
      try {
        const cars = await carsCollection
          .find()
          .limit(6)
          .sort({ createdAt: -1 })
          .toArray();
        res.send(cars);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch cars" });
      }
    });

    // Search cars
    app.get("/search", async (req, res) => {
      try {
        const searchText = req.query.search || "";
        const query = { carName: { $regex: searchText, $options: "i" } };
        const result = await carsCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Search failed" });
      }
    });

    // Add car POST
    app.post("/cars", verifyToken, async (req, res) => {
      try {
        const data = req.body;
        const result = await carsCollection.insertOne(data);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to add car" });
      }
    });

    // Get car by ID
    app.get("/cars/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const car = await carsCollection.findOne({ _id: new ObjectId(id) });
        res.status(200).send(car);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to get car" });
      }
    });

    // Delete car
    app.delete("/cars/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        const result = await carsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 1)
          res
            .status(200)
            .send({ success: true, message: "Car deleted successfully" });
        else res.status(404).send({ success: false, message: "Car not found" });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ success: false, message: "Failed to delete car" });
      }
    });

    //  Booking Routes

    // Add booking
    app.post("/booking", verifyToken, async (req, res) => {
      try {
        const data = req.body;
        const result = await bookingCollection.insertOne(data);

        // Update car status to unavailable after booking
        await carsCollection.updateOne(
          { _id: new ObjectId(data.carId) },
          { $set: { status: "Unavailable" } }
        );

        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to add booking" });
      }
    });

    // Get all bookings
    app.get("/booking", async (req, res) => {
      try {
        const bookings = await bookingCollection.find().toArray();
        res.send(bookings);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to fetch bookings" });
      }
    });

    // Delete booking
    app.delete("/booking/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        const result = await bookingCollection.deleteOne({
          _id: id,
        });
        if (result.deletedCount === 1)
          res
            .status(200)
            .send({ success: true, message: "Booking deleted successfully" });
        else
          res
            .status(404)
            .send({ success: false, message: "Booking not found" });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ success: false, message: "Failed to delete booking" });
      }
    });

    // await client.db("admin").command({ ping: 1 });
    console.log("MongoDB Ping Successful. Connected to Database!");
  } finally {
    // client.close();
  }
}

run().catch(console.dir);

//  Base Route
app.get("/", (req, res) => {
  res.send("Hello World! Rent Wheels API is running.");
});

// Start Server
module.exports = app;
