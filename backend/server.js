const express = require('express')
const cors = require('cors');
const connectDB = require('./config/db')
require('dotenv').config()


const app = express()
connectDB()

const strandRoutes = require('./routes/strandRoutes');
const substrandRoutes = require('./routes/substrandRoutes');
const authRoutes = require('./routes/authRoutes');
const docRoutes = require('./routes/documentRoutes')
const authMiddleware = require('./middleware/auth')
const teachersRoutes = require('./routes/teacherRoutes')
const schoolRoutes = require('./routes/schoolRoutes')
const paymentRoute = require('./routes/paymentRoute')
const learningAreaRoutes = require('./routes/learningAreaRoutes')

const allowedOrigins = [
  'http://localhost:5173',
  'https://dbsl-liart.vercel.app'
];


app.use(cors({
     origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

app.use(express.json())

app.use('/api/strands', strandRoutes);
app.use('/api/substrands', substrandRoutes);
app.use('/api/learningareas', learningAreaRoutes)
app.use('/api/user', authRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/teacher', teachersRoutes)
app.use('/api/school', schoolRoutes)
app.use('/api/payments', paymentRoute)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log("Server running on PORT 5000"))