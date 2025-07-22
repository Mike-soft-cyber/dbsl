const mongoose = require('mongoose')
require('dotenv').config()

const connectDB = async () => {
    try {
        const db = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB Connected`)
    } catch (error) {
        console.error("MongoDB connection error")
        process.exit(1)
    }
}

module.exports = connectDB 