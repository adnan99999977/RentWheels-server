const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
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
const bookingCollection = DB.collection("booking")

async function run() {
  try {
    await client.connect();

    //  cars collection

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
