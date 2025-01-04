require('dotenv').config();
const express = require('express');
const app = express();
//const mongoose = require('mongoose');
//const connectDB = require('./config/db_connection');
const functions = require("firebase-functions");

const port = process.env.PORT || 3000;

// Connect to MongoDB
//connectDB();

app.use(express.urlencoded({ extended: false }));
// Middleware to parse JSON request bodies
app.use(express.json());


// Middleware to log incoming requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the API!' });
})

app.use('/post', require('./routes/blog_route'));

app.use('/trade', require('./routes/trading_route'));


// mongoose.connection.once('open', () => {
//     console.log('Connected to MongoDB');


// });;
app.listen(port, () => console.log(`Server running on port ${port}`));

//module.exports = app;  for vercel deployment
//exports.api = functions.https.onRequest(app);