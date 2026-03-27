const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_key";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err));

/* =========================
   SCHEMAS
========================= */

const productSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    image: String,
    category: String,
    description: String,
  },
  { timestamps: true }
);

const adminSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
    role: { type: String, default: "admin" },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "user" },
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    address: String,
    cart: Array,
    total: Number,
    date: String,
    status: { type: String, default: "Pending" },
    userId: String,
    userEmail: String,
    userName: String,
  },
  { timestamps: true }
);

/* =========================
   MODELS
========================= */

const Product = mongoose.model("Product", productSchema);
const Admin = mongoose.model("Admin", adminSchema);
const User = mongoose.model("User", userSchema);
const Order = mongoose.model("Order", orderSchema);

/* =========================
   SEED ADMIN
========================= */

async function seedAdmin() {
  try {
    const existing = await Admin.findOne({ username: "admin" });

    if (!existing) {
      const hashed = await bcrypt.hash("admin123", 10);

      await Admin.create({
        username: "admin",
        password: hashed,
        role: "admin",
      });

      console.log("Default admin created: admin / admin123");
    }
  } catch (err) {
    console.log("Seed admin error:", err);
  }
}

seedAdmin();

/* =========================
   MIDDLEWARE
========================= */

function authAdmin(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function authUser(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* =========================
   ADMIN LOGIN
========================= */

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Login error" });
  }
});

/* =========================
   USER REGISTER / LOGIN
========================= */

app.post("/api/user/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "И-мэйл бүртгэлтэй байна" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({ message: "Бүртгэл амжилттай" });
  } catch (err) {
    res.status(500).json({ error: "Бүртгэл үүсгэхэд алдаа гарлаа" });
  }
});

app.post("/api/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "И-мэйл эсвэл нууц үг буруу" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "И-мэйл эсвэл нууц үг буруу" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Нэвтрэхэд алдаа гарлаа" });
  }
});

/* =========================
   ORDERS
========================= */

app.post("/api/order", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json({ message: "Order saved" });
  } catch (err) {
    res.status(500).json({ error: "Order save error" });
  }
});

app.get("/api/orders", authAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ _id: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Order fetch error" });
  }
});

app.put("/api/order/:id/status", authAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: "Status update error" });
  }
});

app.delete("/api/order/:id", authAdmin, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete error" });
  }
});

/* =========================
   PRODUCTS CRUD
========================= */

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Product fetch error" });
  }
});

app.post("/api/products", authAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ message: "Product created" });
  } catch (err) {
    res.status(500).json({ error: "Product create error" });
  }
});

app.put("/api/products/:id", authAdmin, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Product updated" });
  } catch (err) {
    res.status(500).json({ error: "Product update error" });
  }
});

app.delete("/api/products/:id", authAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Product delete error" });
  }
});

/* =========================
   PAGES
========================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});