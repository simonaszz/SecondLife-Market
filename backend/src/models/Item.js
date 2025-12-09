const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Pavadinimas privalomas"],
      trim: true,
      maxlength: [100, "Pavadinimas negali viršyti 100 simbolių"],
    },
    description: {
      type: String,
      required: [true, "Aprašymas privalomas"],
      maxlength: [2000, "Aprašymas negali viršyti 2000 simbolių"],
    },
    price: {
      type: Number,
      required: [true, "Kaina privaloma"],
      min: [0, "Kaina negali būti neigiama"],
    },
    category: {
      type: String,
      required: [true, "Kategorija privaloma"],
      enum: [
        "Drabužiai",
        "Avalynė",
        "Aksesuarai",
        "Elektronika",
        "Namų apyvoka",
        "Vaikams",
        "Grožis",
        "Sportas",
        "Kita",
      ],
    },
    condition: {
      type: String,
      required: [true, "Būklė privaloma"],
      enum: ["Nauja su etikete", "Nauja be etiketės", "Labai gera", "Gera", "Patenkinama"],
    },
    size: {
      type: String,
      default: "",
    },
    brand: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "",
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "sold", "reserved", "hidden"],
      default: "active",
    },
    views: {
      type: Number,
      default: 0,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    location: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Index paieškos optimizavimui
itemSchema.index({ title: "text", description: "text", brand: "text" });
itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ seller: 1 });
itemSchema.index({ price: 1 });
itemSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Item", itemSchema);
