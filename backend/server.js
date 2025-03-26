import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import surveyRoutes from './routes/surveyRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5050

// Middleware
app.use(cors())
app.use(express.json())

app.use('/api/survey', surveyRoutes)
app.use('/api/admin', adminRoutes)

// Root Route
app.get('/', (req, res) => {
  res.send('API is running...')
})

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB connected')
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})
.catch(err => console.error('MongoDB connection error:', err))
