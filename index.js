const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STYPE_KEY);

const app = express();
const port = process.env.prot || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bnskqpv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.jwt_token, function (error, decoded) {
    if (error) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    const categoryCollection = client.db("BikroyStore").collection("categorys");
    const productsCollection = client.db("BikroyStore").collection("products");
    const usersCollection = client.db("BikroyStore").collection("users");
    const bookingsCollection = client.db("BikroyStore").collection("bookings");
    const paymentsCollection = client.db("BikroyStore").collection("payments");

    // const wishlistsCollection = client
    //   .db("BikroyStore")
    //   .collection("wishlists");

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

    // Product add
    app.post("/products", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "Seller") {
        return res.status(403).send({ message: "forbidden access" });
      }
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    // Delete Product
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // Add advertise Product update
    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          advertise: "advertised",
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Advertised Product get
    app.get("/advertised", async (req, res) => {
      const query = { advertise: "advertised" };
      const advertised = await productsCollection.find(query).toArray();
      res.send(advertised);
    });

    // All Products
    app.get("/products", async (req, res) => {
      const category = req.query.category;
      if (category) {
        const filter = { category: category };
        const filterProducts = await productsCollection.find(filter).toArray();
        return res.send(filterProducts);
      }

      const products = await productsCollection.find({}).toArray();
      res.send(products);
    });

    // Report Products
    app.put("/products/report/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          report: "reported",
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Reported product get
    app.get("/products/report", verifyJWT, async (req, res) => {
      const report = req.query.report;
      const query = { report: report };
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    // User ways Product get
    app.get("/userProducts", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const query = { sellerEmail: email };
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    // User info save database
    app.post("/users", async (req, res) => {
      const email = req.body.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.email === email) {
        return res.send({ message: "User Already added" });
      }
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    // users get api
    app.get("/users", verifyJWT, async (req, res) => {
      const role = req.query.role;
      if (role) {
        const filter = { role: role };
        const result = await usersCollection.find(filter).toArray();
        return res.send(result);
      }

      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    // user Admin check
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ Admin: user?.role === "Admin" });
    });

    // user seller check
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ Seller: user?.role === "Seller" });
    });

    app.get("/user", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const user = await usersCollection.findOne(filter);
      res.send(user);
    });

    // Delete User
    app.delete("/users/:id", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "Admin") {
        return res.status(403).send({ message: "forbidden access" });
      }

      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });

    // make seller verify
    app.put("/users/:id", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "Admin") {
        return res.status(403).send({ message: "forbidden access" });
      }

      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          verify: "verify",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.jwt_token, {
          expiresIn: "10h",
        });

        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    // Wishlist products
    app.post("/wishlists", async (req, res) => {
      const wishlist = req.body;
      const result = await wishlistsCollection.insertOne(wishlist);
      res.send(result);
    });

    // Get Wishlist
    app.get("/wishlists", async (req, res) => {
      const email = req.query.email;
      const filter = { user: email };
      const wishlists = await wishlistsCollection.find(filter).toArray();
      res.send(wishlists);
    });

    // Delete Wishlist
    app.delete("/wishlists/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await wishlistsCollection.deleteOne(query);
      res.send(result);
    });

    // Targetet Booking
    app.get("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const booking = await bookingsCollection.findOne(filter);
      res.send(booking);
    });

    // Booking post
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    // Booking Delete
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);
    });

    // Booking get
    app.get("/bookings", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (decodedEmail !== email) {
        return res.status(401).send({ message: "forbidden access" });
      }

      const query = { buyerEmail: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);

      // Update booking
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          paid: true,
        },
      };
      const updateBooking = await bookingsCollection.updateOne(
        filter,
        updateDoc
      );

      // update product advertise and available/sold
      const productId = payment.ProductId;
      const query = { _id: ObjectId(productId) };
      const option = { upsert: true };
      const updateAdvertiseDoc = {
        $set: {
          advertise: "",
          available: "soled",
        },
      };

      const updateAdvertise = await productsCollection.updateOne(
        query,
        updateAdvertiseDoc,
        option
      );

      res.send(result);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const convertPrice = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: convertPrice,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
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
