const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://goldenal:Adexwalex1@cluster0test.rxfsj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0test", {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
    } catch (err) {
        console.error(err);
    }
}

module.exports = connectDB