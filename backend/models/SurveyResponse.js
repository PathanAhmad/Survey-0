import mongoose from 'mongoose'

const answerSchema = new mongoose.Schema({
  pageTitle: String,
  questionChinese: String,
  questionEnglish: String,
  selectedValue: Number
}, { _id: false })

const surveyResponseSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
  school: String,
  answers: [answerSchema],
  timestamp: {
    type: Date,
    default: Date.now
  }
})

const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema)
export default SurveyResponse
