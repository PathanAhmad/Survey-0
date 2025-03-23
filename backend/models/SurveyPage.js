import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  chineseText: { type: String, required: true },
  englishText: { type: String, required: true }
})

const surveyPageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: [questionSchema]
})

const SurveyPage = mongoose.model('SurveyPage', surveyPageSchema)
export default SurveyPage
