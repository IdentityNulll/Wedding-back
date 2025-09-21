// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const QRCode = require("qrcode");
const Wedding = require("./models/Wedding");
const upload = require("./middleware/upload"); // multer setup

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // parse JSON body
app.use("/uploads", express.static("uploads")); // serve uploaded images

app.get("/weddings", async (req, res) => {
  try {
    const weddings = await Wedding.find().sort({ createdAt: -1 });
    res.json(weddings);
  } catch (err) {
    console.error("❌ Weddings fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post(
  "/weddings",
  upload.fields([
    { name: "artistImages", maxCount: 20 },
    { name: "firstMealImage", maxCount: 1 },
    { name: "secondMealImage", maxCount: 1 },
    { name: "thirdMealImage", maxCount: 1 },
    { name: "desertImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        coupleNames,
        firstMeal,
        secondMeal,
        thirdMeal,
        desert,
        popularGuests,
      } = req.body;

      if (!coupleNames || !firstMeal || !secondMeal) {
        return res
          .status(400)
          .json({ error: "coupleNames, firstMeal, secondMeal are required" });
      }

      // Artists
      let artistNames = [];
      if (req.body.artistNames) {
        artistNames = Array.isArray(req.body.artistNames)
          ? req.body.artistNames
          : [req.body.artistNames];
      }
      const artistImages = req.files["artistImages"]
        ? req.files["artistImages"].map((f) => `/uploads/${f.filename}`)
        : [];
      const artists = artistNames.map((name, i) => ({
        name,
        image: artistImages[i] || null,
      }));

      // Meals
      const meals = {
        firstMeal: {
          name: firstMeal,
          image: req.files["firstMealImage"]
            ? `/uploads/${req.files["firstMealImage"][0].filename}`
            : null,
        },
        secondMeal: {
          name: secondMeal,
          image: req.files["secondMealImage"]
            ? `/uploads/${req.files["secondMealImage"][0].filename}`
            : null,
        },
        thirdMeal: {
          name: thirdMeal,
          image: req.files["thirdMealImage"]
            ? `/uploads/${req.files["thirdMealImage"][0].filename}`
            : null,
        },
        desert: {
          name: desert,
          image: req.files["desertImage"]
            ? `/uploads/${req.files["desertImage"][0].filename}`
            : null,
        },
      };

      // Save wedding
      const wedding = new Wedding({
        coupleNames,
        artists,
        meals,
        popularGuests: popularGuests
          ? popularGuests.split(",").map((g) => g.trim())
          : [],
      });

      await wedding.save();

      
      const frontendUrl =
        process.env.FRONTEND_URL || "https://wedding-front.netlify.app";
      const weddingUrl = `${frontendUrl}/?id=${wedding._id}`;

      wedding.qrCode = await QRCode.toDataURL(weddingUrl);
      await wedding.save();

      res.status(201).json(wedding);
    } catch (err) {
      console.error("❌ Wedding creation error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ========================
// Get wedding by ID (GET)
// ========================
app.get("/weddings/:id", async (req, res) => {
  try {
    const wedding = await Wedding.findById(req.params.id);
    if (!wedding) {
      return res.status(404).json({ error: "Wedding not found" });
    }
    res.json(wedding);
  } catch (err) {
    console.error("❌ Wedding fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
