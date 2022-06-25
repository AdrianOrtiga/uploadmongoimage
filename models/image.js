const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  imageInfo: {
    type: Object,
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('ImageDB', ImageSchema)