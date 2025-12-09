const express = require("express");
const Item = require("../models/Item");
const { protect } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/items
// @desc    Gauti visus skelbimus (su filtrais)
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      condition,
      search,
      sort = "-createdAt",
      page = 1,
      limit = 20,
    } = req.query;

    // Filtrai
    const query = { status: "active" };

    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Item.find(query)
        .populate("seller", "username avatar rating")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Item.countDocuments(query),
    ]);

    res.json({
      success: true,
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/items/:id
// @desc    Gauti vieną skelbimą
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      "seller",
      "username avatar rating location createdAt"
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Skelbimas nerastas",
      });
    }

    // Padidinti peržiūrų skaičių
    item.views += 1;
    await item.save();

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/items
// @desc    Sukurti naują skelbimą
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      condition,
      size,
      brand,
      color,
      images,
      location,
    } = req.body;

    // Validacija
    if (!images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Bent viena nuotrauka privaloma",
      });
    }

    const item = await Item.create({
      title,
      description,
      price,
      category,
      condition,
      size,
      brand,
      color,
      images,
      location,
      seller: req.user._id,
    });

    await item.populate("seller", "username avatar rating");

    res.status(201).json({
      success: true,
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/items/:id
// @desc    Atnaujinti skelbimą
// @access  Private (tik savininkas)
router.put("/:id", protect, async (req, res) => {
  try {
    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Skelbimas nerastas",
      });
    }

    // Tikrinti ar vartotojas yra savininkas
    if (item.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Neturite teisių redaguoti šį skelbimą",
      });
    }

    // Atnaujinti
    const allowedUpdates = [
      "title",
      "description",
      "price",
      "category",
      "condition",
      "size",
      "brand",
      "color",
      "images",
      "location",
      "status",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await item.save();
    await item.populate("seller", "username avatar rating");

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/items/:id
// @desc    Ištrinti skelbimą
// @access  Private (tik savininkas)
router.delete("/:id", protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Skelbimas nerastas",
      });
    }

    // Tikrinti ar vartotojas yra savininkas
    if (item.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Neturite teisių ištrinti šį skelbimą",
      });
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: "Skelbimas ištrintas",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/items/:id/favorite
// @desc    Pridėti/pašalinti iš mėgstamų
// @access  Private
router.post("/:id/favorite", protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Skelbimas nerastas",
      });
    }

    const userId = req.user._id;
    const isFavorited = item.favorites.includes(userId);

    if (isFavorited) {
      // Pašalinti iš mėgstamų
      item.favorites = item.favorites.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Pridėti prie mėgstamų
      item.favorites.push(userId);
    }

    await item.save();

    res.json({
      success: true,
      isFavorited: !isFavorited,
      favoritesCount: item.favorites.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/items/user/:userId
// @desc    Gauti vartotojo skelbimus
// @access  Public
router.get("/user/:userId", async (req, res) => {
  try {
    const items = await Item.find({
      seller: req.params.userId,
      status: "active",
    })
      .populate("seller", "username avatar rating")
      .sort("-createdAt");

    res.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
