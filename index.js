const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors());

// DB URI
const uri = `mongodb+srv://${process.env.DB_ADMIN}:${process.env.DB_PASSWORD}@cluster0.egeojdc.mongodb.net/?appName=Cluster`;

// DB client

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// DB connection

const DB = client.db("rentWheelsDB");
const carsCollection = DB.collection("cars");
const bookingCollection = DB.collection("booking");

async function run() {
  try {
    await client.connect();

    //  cars API

    // get cars by email
    app.get("/cars", async (req, res) => {
      try {
        const query = {};
        const providerEmail = req.query.ProviderEmail;

        if (providerEmail) {
          query.providerEmail = providerEmail;
        }

        const cursor = carsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to get cars" });
      }
    });
    // get all cars
    app.get("/cars", async (req, res) => {
      try {
        const cursor = carsCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to get data " });
      }
    });

    // post a car in cars
    app.post("/cars", async (req, res) => {
      try {
        const data = req.body;
        const result = await carsCollection.insertOne(data);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to add car" });
      }
    });

    // get a car by email
    app.get("/cars/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const newObjectId = new ObjectId(id);
        const result = await carsCollection.findOne({ _id: newObjectId });
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to get" });
      }
    });

    // update car status by patch
    app.patch("/cars/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: { status: status },
        };
        const result = await carsCollection.updateOne(filter, updateDoc);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to update status" });
      }
    });

    // update car  by put
    app.put("/cars/:id", async (req, res) => {
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

    //   delete car from cars
    app.delete("/cars/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const filter = { _id: new ObjectId(id) };

        const result = await carsCollection.deleteOne(filter);

        if (result.deletedCount === 1) {
          res
            .status(200)
            .send({ success: true, message: "Car deleted successfully" });
        } else {
          res.status(404).send({ success: false, message: "Car not found" });
        }
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ success: false, message: "Failed to delete car" });
      }
    });

    // booking API

    // book a car
    app.post("/booking", async (req, res) => {
      try {
        const data = req.body;
        const result = await bookingCollection.insertOne(data);
        res.send(result);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to add car" });
      }
    });
    // get booked car card
    app.get("/booking", async (req, res) => {
      const cursor = bookingCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // delete car from booking

    app.delete("/booking/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const filter = { _id: id };

        const result = await bookingCollection.deleteOne(filter);

        if (result.deletedCount === 1) {
          res
            .status(200)
            .send({ success: true, message: "Car deleted successfully" });
        } else {
          res.status(404).send({ success: false, message: "Car not found" });
        }
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ success: false, message: "Failed to delete car" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

// server connection

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
