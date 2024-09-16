const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);



// Define the schema for the blog post
const blogSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, // Auto-incremented ID
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  tags: [String],

}, { timestamps: true });

// Use the auto-increment plugin on the 'id' field
blogSchema.plugin(AutoIncrement, { inc_field: 'id' });

// Create a model from the schema
const Blog = mongoose.model('Blogpost', blogSchema);

module.exports = Blog;
