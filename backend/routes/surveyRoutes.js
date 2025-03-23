import express from 'express'
import SurveyResponse from '../models/SurveyResponse.js'

const router = express.Router()

router.post('/submit', async (req, res) => {
  try {
    const { name, age, gender, school, answers } = req.body

    const newResponse = new SurveyResponse({
      name, age, gender, school, answers
    })

    await newResponse.save()
    res.status(201).json({ message: 'Response saved successfully' })
  } catch (error) {
    console.error('Error saving survey response:', error)
    res.status(500).json({ message: 'Failed to save response' })
  }
})

export default router
