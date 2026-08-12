import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: true,
    },
    role: {
      type: String,
      require: true,
      enum: ["Admin", "Manager", "User"],
      default: "User",
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
