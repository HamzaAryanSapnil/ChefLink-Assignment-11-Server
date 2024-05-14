require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q4gzfbc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Send a ping to confirm a successful connection
    const userCollention = client.db("ChefLink_DB").collection("users");
    const purchaseCollection = client
      .db("ChefLink_DB")
      .collection("Purchased_Foods");
    const allFoodItemsCollection = client
      .db("ChefLink_DB")
      .collection("All_Food_Items");

    // auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
      .cookie("access-token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
      })
      .send({success: true});
    });

    // services related api

    // get all purchased food
    app.get("/purchasedFood", async (req, res) => {
      console.log(req.query?.email);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query?.email };
      }
      console.log(query);
      const result = await purchaseCollection.find(query).toArray();
      res.send(result);
    });

    // get all food items
    app.get("/allFoodItems", async (req, res) => {
      console.log(req.query.email);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query?.email };
      }
      const cursor = allFoodItemsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get single food by id
    app.get("/allFoodItems/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        // Include only the `title` and `imdb` fields in the returned document
        projection: {
          foodName: 1,
          foodImageUrl: 1,
          foodCategory: 1,
          price: 1,
          userName: 1,
          description: 1,
          foodOrigin: 1,
          quantity: 1,
          email: 1,
        },
      };
      const result = await allFoodItemsCollection.findOne(query);
      res.send(result);
    });

    // get all food images from all food items collection

    // post users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollention.insertOne(user);
      res.send(result);
    });

    // post foods in all food items collection
    app.post("/allFoodItems", async (req, res) => {
      const food = req.body;
      const result = await allFoodItemsCollection.insertOne(food);
      res.send(result);
    });

    // post purchased food
    app.post("/purchasedFood", async (req, res) => {
      const food = req.body;
      console.log(food);
      const result = await purchaseCollection.insertOne(food);
      res.send(result);
    });

    // update food in all food items collection
    app.put("/allFoodItems/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedFood = req.body;
      const food = {
        $set: {
          foodName: updatedFood.foodName,
          foodImageUrl: updatedFood.foodImageUrl,
          foodCategory: updatedFood.foodCategory,
          price: updatedFood.price,
          userName: updatedFood.userName,
          description: updatedFood.description,
          foodOrigin: updatedFood.foodOrigin,
        },
      };
      const result = await allFoodItemsCollection.updateOne(
        filter,
        food,
        options
      );
      res.send(result);
    });

    // update food in purchased food collection
    app.patch("/purchasedFood/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: req.body.status,
        },
      };
      const result = await purchaseCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // delete food from all food items collection
    app.delete("/allFoodItems/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allFoodItemsCollection.deleteOne(query);
      res.send(result);
    });

    // delete food customer data from purchased food collection
    app.delete("/purchasedFood/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await purchaseCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Assignment 11 server is running");
});

app.listen(port, () =>
  console.log(`Assignment 11 server running on port ${port}`)
);
