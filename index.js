const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.prot || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bnskqpv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const categoryCollection = client.db("BikroyStore").collection("categorys");
    const productsCollection = client.db("BikroyStore").collection("products");

    // All category
    app.get("/categorys", async (req, res) => {
      const categorys = await categoryCollection.find({}).toArray();
      res.send(categorys);
    });

    // Targetet Category
    app.get("/categorys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const category = await categoryCollection.findOne(query);
      res.send(category);
    });

    // All Products
    app.get("/products", async (req, res) => {
      const category = req.query.category;
      //   console.log(categoryName);

      const filter = { category: category };
      const filterProducts = await productsCollection.find(filter).toArray();
      return res.send(filterProducts);

      const products = await productsCollection.find({}).toArray();
      res.send(products);
    });
  } catch (error) {
    console.log(error.message);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("BikroyStore Server Running");
});

app.listen(port, () => {
  console.log(`BikroyStore Server Running on port ${port}`);
});
