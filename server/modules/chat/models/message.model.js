const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      required: true,
      unique: true // Perfect for client-side deduplication
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    deliveryStatus: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent'
    },
    // Legacy support to prevent breaking current app prior to migration
    isRead: {
      type: Boolean,
      default: false
    },
    content: {
      original: {
        type: String,
        required: true,
        trim: true
      },
      translations: {
        type: Map,
        of: String,
        default: {}
      }
    },
    // Media URLs uploaded via HTTP (not socket base64)
    media: {
      url: { type: String },
      mimeType: { type: String },
      fileType: { type: String, enum: ['image', 'video', 'audio', 'file', null], default: null }
    }
  },
  { timestamps: true }
);

messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ from: 1, createdAt: -1 });
messageSchema.index({ to: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);