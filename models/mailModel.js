const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  to: { type: String, required: true },
  subject: { type: String, required: true },
  text: { type: String, required: true },
  html: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  labels: [{ type: String }],
  attachments: [{
    fileName: { type: String, required: true },
    contentType: { type: String, required: true },
    content: { type: Buffer, required: true },
  }],
});

const Email = mongoose.model('Email', emailSchema);

module.exports = Email;
