require("dotenv").config();
const express = require("express");
const cors = require("cors"); // 1. استيراد المكتبة أولاً
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const Post = require("./models/Post");
const User = require("./models/User");

const app = express();
// =========================
// Middleware (الترتيب هنا هو السر)
// =========================
app.use(cors({
  origin: "*", // يسمح لأي مصدر مؤقتاً للتجربة
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
})); // 2. تفعيل الكورس قبل أي شيء آخر
app.use(express.json()); // 3. استقبال البيانات JSON
app.use("/uploads", express.static("uploads"));

// =========================
// Multer Config
// =========================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// =========================
// Middleware
// =========================

// =========================
// MongoDB Connection
// =========================
const PORT = process.env.PORT || 8080;

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  console.log("MongoDB Connected 🔥");

  app.listen(process.env.PORT, () => {
  console.log("Server running");
});
})
.catch((err) => {
  console.log("MongoDB Error:", err.message);

  // تشغيل السيرفر حتى لو MongoDB فشل
  app.listen(process.env.PORT, () => {
  console.log("Server running");
});
});
// =========================
// Auth Middleware
// =========================
function auth(req, res, next) {
  console.log("VERIFY SECRET:", process.env.JWT_SECRET); // 👈 هنا


  console.log("AUTH MIDDLEWARE WORKING ✌");

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided ✌" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("DECODED TOKEN:", decoded);

    req.user = decoded;
    return next();

  } catch (err) {
    console.log("JWT ERROR:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
}

// =========================
// Register API
// =========================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// Login API (JWT)
// =========================
app.post("/api/login", async (req, res) => {
  try {
    console.log("SIGN SECRET:", process.env.JWT_SECRET); // 👈 هنا
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// Get Posts (Public)
// =========================
// app.get("/api/posts", async (req, res) => {
//   try {
//     const posts = await Post.find().sort({ createdAt: -1 });
//     res.json(posts);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
app.get("/", (req, res) => {
  res.send("API IS ALIVE");
});
// =========================
// Create Post (Protected)
// =========================

app.post("/api/posts", auth, async (req, res) => {
  try {
    console.log("POST HIT");
    console.log("BODY:", req.body);

    if (!req.body.title || !req.body.body) {
      return res.status(400).json({
        message: "Title and body are required"
      });
    }

    const post = await Post.create({
      title: req.body.title,
      body: req.body.body,
      image: req.body.image, // 👈 هنا الرابط
      user: {
        name: req.user.name,
        profileImage: `https://i.pravatar.cc/150?u=${req.user.id}`,
      },
    });

    res.status(201).json(post);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});