const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  technologies: [{
    type: String
  }],
  imageUrl: {
    type: String
  },
  projectUrl: {
    type: String
  },
  githubUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema);