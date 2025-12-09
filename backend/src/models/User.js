const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Vartotojo vardas privalomas"],
      unique: true,
      trim: true,
      minlength: [3, "Vartotojo vardas turi būti bent 3 simbolių"],
    },
    email: {
      type: String,
      required: [true, "El. paštas privalomas"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Neteisingas el. pašto formatas"],
    },
    password: {
      type: String,
      required: [true, "Slaptažodis privalomas"],
      minlength: [6, "Slaptažodis turi būti bent 6 simbolių"],
      select: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password prieš išsaugant
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Palyginti slaptažodžius
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
