import mongoose, { Schema } from "mongoose";

const VisitorSchema = new Schema(
  {
    ip: { type: String, required: true, index: true },
    userAgent: String,
    lastSeen: { type: Date, required: true },
  },
  { timestamps: true }
);

// same IP ek hi entry
// VisitorSchema.index({ ip: 1 }, { unique: true });

export default mongoose.models.Visitor ||
  mongoose.model("Visitor", VisitorSchema);
