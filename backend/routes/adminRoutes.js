import express from 'express'
import SurveyPage from '../models/SurveyPage.js'

const router = express.Router()

// Create a new page
router.post('/page', async (req, res) => {
  try {
    const { title } = req.body
    const page = new SurveyPage({ title, questions: [] })
    await page.save()
    res.status(201).json(page)
  } catch (err) {
    res.status(500).json({ message: 'Error creating page' })
  }
})

// Add a question to a page
router.post('/page/:pageId/question', async (req, res) => {
  try {
    const { chineseText, englishText } = req.body
    const page = await SurveyPage.findById(req.params.pageId)
    page.questions.push({ chineseText, englishText })
    await page.save()
    res.status(200).json(page)
  } catch (err) {
    res.status(500).json({ message: 'Error adding question' })
  }
})

// Get all pages
router.get('/pages', async (req, res) => {
  try {
    const pages = await SurveyPage.find()
    res.json(pages)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pages' })
  }
})

// Update a page's questions
router.put('/page/:pageId', async (req, res) => {
    try {
        const { questions } = req.body
        const page = await SurveyPage.findById(req.params.pageId)
        if (!page) return res.status(404).json({ message: 'Page not found' })

        page.questions = questions
        await page.save()

        res.json({ message: 'Page updated' })
    } catch (err) {
        res.status(500).json({ message: 'Failed to update page' })
    }
    })

// Delete a page
router.delete('/page/:pageId', async (req, res) => {
  try {
    const page = await SurveyPage.findByIdAndDelete(req.params.pageId)
    if (!page) {
      return res.status(404).json({ message: 'Page not found' })
    }
    res.json({ message: 'Page deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Error deleting page' })
  }
})


export default router
