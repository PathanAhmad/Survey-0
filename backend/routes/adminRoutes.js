import express from 'express'
import SurveyPage from '../models/SurveyPage.js'
import SurveyResponse from '../models/SurveyResponse.js'
import { Parser } from 'json2csv'

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

// Route to download responses as CSV
router.get('/responses/csv', async (req, res) => {
  try {
    const responses = await SurveyResponse.find().lean();
    if (!responses.length) return res.status(404).send('No responses found');

    const pages = await SurveyPage.find().lean();

    // Sequential mapping with Q prefix
    const questionNumberMap = {};
    let questionCounter = 1;
    pages.forEach(page => {
      page.questions.forEach(question => {
        const key = question.englishText;
        if (!questionNumberMap[key]) {
          questionNumberMap[key] = `Q${questionCounter++}`;
        }
      });
    });

    const fields = ['Name', 'Age', 'Gender', 'School', 'Timestamp'];
    for (let i = 1; i <= Object.keys(questionNumberMap).length; i++) {
      fields.push(`Q${i}`);
    }

    // Map original 1-7 scale to new scale
    const valueMap = { '1': 3, '2': 2, '3': 1, '4': 0, '5': -1, '6': -2, '7': -3 };

    const csvRows = responses.map(response => {
      const row = {
        Name: response.name,
        Age: response.age?.$numberInt ? parseInt(response.age.$numberInt) : response.age,
        Gender: response.gender,
        School: response.school,
        Timestamp: new Date(response.timestamp?.$date?.$numberLong 
                   ? parseInt(response.timestamp.$date.$numberLong) 
                   : response.timestamp).toISOString(),
      };

      // Initialize all questions with empty strings
      Object.values(questionNumberMap).forEach(qNum => row[qNum] = '');

      // Fill answers with mapped scale values
      response.answers.forEach(answer => {
        const colNum = questionNumberMap[answer.questionEnglish];
        if (colNum) {
          const originalVal = answer.selectedValue.$numberInt || answer.selectedValue;
          row[colNum] = valueMap[originalVal.toString()] ?? '';
        }
      });

      return row;
    });

    const parser = new Parser({ fields });
    const csv = parser.parse(csvRows);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`survey_responses_${Date.now()}.csv`);
    res.send('\uFEFF' + csv);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating CSV');
  }
});


export default router
