const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Generuoti JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @route   POST /api/auth/register
// @desc    Registruoti naują vartotoją
// @access  Public
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Tikrinti ar vartotojas jau egzistuoja
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? "El. paštas jau užregistruotas"
            : "Vartotojo vardas jau užimtas",
      });
    }

    // Sukurti vartotoją
    const user = await User.create({
      username,
      email,
      password,
    });

    // Grąžinti token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/auth/login
// @desc    Prisijungti
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validacija
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Įveskite el. paštą ir slaptažodį",
      });
    }

    // Rasti vartotoją
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Neteisingi prisijungimo duomenys",
      });
    }

    // Tikrinti slaptažodį
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Neteisingi prisijungimo duomenys",
      });
    }

    // Grąžinti token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/auth/me
// @desc    Gauti dabartinį vartotoją
// @access  Private
router.get("/me", protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
      bio: req.user.bio,
      location: req.user.location,
      rating: req.user.rating,
      reviewCount: req.user.reviewCount,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = router;
