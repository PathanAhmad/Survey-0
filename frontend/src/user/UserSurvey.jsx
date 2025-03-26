import React, { useState, useEffect } from 'react'

const COLORS = {
  floralBg: '#F8F8F2',
  overlay: 'rgba(255, 255, 255, 0.85)',
  textBase: '#2C2C2C',
  heading: '#333333',
  muted: '#555555',

  brandPink: '#E91E63',   // Pink for "Previous"
  brandGreen: '#33A474',  // Green for "Next/Submit" if valid
  brandPurple: '#88619A',
  brandGray: '#CACACA',
  buttonBg: '#EC407A',
  buttonDisabled: '#BFBFBF',
}

const baseURL = import.meta.env.VITE_API_BASE_URL

const UserSurvey = () => {
  const [info, setInfo] = useState({
    name: '',
    age: '',
    gender: '',
    school: '',
    robot: false,
  })
  const [step, setStep] = useState(0)
  const [pages, setPages] = useState([])
  const [responses, setResponses] = useState({})
  const [activeQuestionIndex, setActiveQuestionIndex] = useState({})
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  // For age check
  const [ageError, setAgeError] = useState('')

  const handleAgeChange = (e) => {
    const val = e.target.value
    if (val === '' || parseInt(val) < 0) {
      setAgeError('Age must be a non-negative number.')
      setInfo({ ...info, age: '' })
    } else {
      setAgeError('')
      setInfo({ ...info, age: val })
    }
  }

  const isFormValid =
    info.name &&
    info.age &&
    !ageError &&
    info.gender &&
    info.school &&
    info.robot

  useEffect(() => {
    if (step === 1) {
      setLoading(true)
      fetch(`${baseURL}/admin/pages`)
        .then((res) => res.json())
        .then((data) => {
          setPages(data)
          const initialActive = {}
          data.forEach((page) => {
            initialActive[page._id] = 0
          })
          setActiveQuestionIndex(initialActive)
        })
        .catch((err) => {
          console.error('Error fetching survey pages:', err)
          alert('Failed to load survey')
        })
        .finally(() => setLoading(false))
    }
  }, [step])

  const handleRadio = (pageId, index, value) => {
    const key = `${pageId}|${index}`
    setResponses((prev) => ({
      ...prev,
      [key]: value,
    }))

    setActiveQuestionIndex((prev) => {
      if (index === prev[pageId]) {
        return { ...prev, [pageId]: index + 1 }
      }
      return prev
    })
  }

  const handleSubmit = async () => {
    const answers = []
    for (const page of pages) {
      page.questions.forEach((q, idx) => {
        const key = `${page._id}|${idx}`
        const selectedValue = responses[key]
        if (selectedValue) {
          answers.push({
            pageTitle: page.title,
            questionChinese: q.chineseText,
            questionEnglish: q.englishText,
            selectedValue,
          })
        }
      })
    }

    const payload = { ...info, answers }

    try {
      await fetch(`${baseURL}/survey/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      alert('Submitted successfully!')
      // reset
      setStep(0)
      setInfo({ name: '', age: '', gender: '', school: '', robot: false })
      setResponses({})
      setCurrentPageIndex(0)
      setActiveQuestionIndex({})
    } catch (err) {
      console.error('Submission failed:', err)
      alert('Submission failed')
    }
  }

  if (loading) {
    return (
      <div
        className="w-screen h-screen flex items-center justify-center text-xl font-semibold"
        style={{
          backgroundColor: COLORS.floralBg,
          color: COLORS.textBase,
        }}
      >
        Loading...
      </div>
    )
  }

  // STEP 0: Basic info form
  if (step === 0) {
    return (
      <div
        className="
          min-h-screen w-screen bg-cover bg-center bg-no-repeat
          flex items-start justify-center
        "
        style={{
          backgroundImage: `url('Images/Flowers.gif')`,
          backgroundColor: COLORS.floralBg,
          color: COLORS.textBase,
        }}
      >
        <div className="pt-60 px-6 w-full max-w-md mx-auto flex flex-col items-center">
          <h2
            className="text-3xl font-bold mb-4 text-center"
            style={{ color: COLORS.heading }}
          >
            Fill in your information
          </h2>

          <input
            className="
              w-full p-2 mb-3 rounded border focus:outline-none focus:ring-2
              focus:ring-pink-500 text-base
            "
            placeholder="Name"
            style={{
              backgroundColor: 'white',
              borderColor: COLORS.muted,
              color: COLORS.textBase,
            }}
            value={info.name}
            onChange={(e) => setInfo({ ...info, name: e.target.value })}
          />

          <input
            type="number"
            min="0"
            className="
              w-full p-2 mb-1 rounded border focus:outline-none focus:ring-2
              focus:ring-pink-500 text-base
            "
            placeholder="Enter a number for age"
            style={{
              backgroundColor: 'white',
              borderColor: COLORS.muted,
              color: COLORS.textBase,
            }}
            value={info.age}
            onChange={handleAgeChange}
          />
          {ageError && (
            <p className="text-red-600 text-sm mb-3">{ageError}</p>
          )}

          <input
            className="
              w-full p-2 mb-3 rounded border focus:outline-none focus:ring-2
              focus:ring-pink-500 text-base
            "
            placeholder="Gender"
            style={{
              backgroundColor: 'white',
              borderColor: COLORS.muted,
              color: COLORS.textBase,
            }}
            value={info.gender}
            onChange={(e) => setInfo({ ...info, gender: e.target.value })}
          />

          <input
            className="
              w-full p-2 mb-3 rounded border focus:outline-none focus:ring-2
              focus:ring-pink-500 text-base
            "
            placeholder="School"
            style={{
              backgroundColor: 'white',
              borderColor: COLORS.muted,
              color: COLORS.textBase,
            }}
            value={info.school}
            onChange={(e) => setInfo({ ...info, school: e.target.value })}
          />

          <label className="mb-4 flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={info.robot}
              onChange={(e) => setInfo({ ...info, robot: e.target.checked })}
              className="h-4 w-4 border-gray-400 rounded"
              style={{ accentColor: COLORS.brandPink }}
            />
            <span>I&apos;m not a robot</span>
          </label>

          <button
            className="mt-2 px-6 py-2 rounded text-white font-semibold transition-all"
            style={{
              backgroundColor: isFormValid
                ? COLORS.buttonBg
                : COLORS.buttonDisabled,
              cursor: isFormValid ? 'pointer' : 'not-allowed',
            }}
            disabled={!isFormValid}
            onClick={() => setStep(1)}
          >
            Start Survey
          </button>
        </div>
      </div>
    )
  }

  // STEP 1: Survey
  const page = pages[currentPageIndex]
  const allAnswered = page?.questions.every(
    (_, i) => responses[`${page._id}|${i}`]
  )

  return (
    <div
      className="
        min-h-screen w-screen bg-cover bg-center bg-no-repeat
        flex flex-col items-start justify-start
      "
      style={{
        // backgroundImage: `url('Images/Flowers.gif')`,
        backgroundColor: COLORS.floralBg,
        color: COLORS.textBase,
      }}
    >
      <div className="pt-40 px-6 w-full max-w-4xl mx-auto transition-all duration-700">
        <h2
          className="text-3xl font-bold mb-4 text-center"
          style={{ color: COLORS.heading }}
        >
          {page?.title}
        </h2>

        {page?.questions.map((q, index) => {
          const key = `${page._id}|${index}`
          const isUnlocked = index <= (activeQuestionIndex[page._id] || 0)
          const isDisabled = !isUnlocked ? 'pointer-events-none opacity-50' : ''

          return (
            <div
              className={`mb-6 flex flex-col items-center text-center ${isDisabled}`}
              key={index}
            >
              <p
                className="text-lg font-semibold"
                style={{ color: COLORS.heading }}
              >
                {q.chineseText}
              </p>
              <p className="mb-2" style={{ color: COLORS.muted }}>
                {q.englishText}
              </p>

              <div className="flex items-center justify-center space-x-3">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  const isSelected = responses[key] === num

                  let borderColor = '#888'
                  if (num <= 3) borderColor = COLORS.brandGreen
                  if (num >= 5) borderColor = COLORS.brandPurple

                  let bgColor = 'transparent'
                  if (isSelected && num <= 3) bgColor = COLORS.brandGreen
                  if (isSelected && num >= 5) bgColor = COLORS.brandPurple
                  if (isSelected && num === 4) bgColor = COLORS.brandGray

                  let size = 'w-6 h-6'
                  if (num === 1 || num === 7) size = 'w-12 h-12'
                  if (num === 2 || num === 6) size = 'w-10 h-10'
                  if (num === 3 || num === 5) size = 'w-8 h-8'

                  return (
                    <label key={num} className="cursor-pointer">
                      <input
                        type="radio"
                        name={key}
                        value={num}
                        checked={isSelected}
                        onChange={() => handleRadio(page._id, index, num)}
                        className="hidden"
                      />
                      <div
                        className={`
                          rounded-full border-4 flex items-center justify-center
                          transition-all duration-300
                          ${size}
                        `}
                        style={{
                          borderColor,
                          backgroundColor: bgColor,
                        }}
                      >
                        {isSelected && (
                          <span className="text-white font-bold text-lg">
                            ✓
                          </span>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/** 
        Large rectangular or pill-shaped buttons with text 
        for Next / Previous / Submit 
      */}
      {currentPageIndex > 0 && (
        <button
          onClick={() => setCurrentPageIndex(currentPageIndex - 1)}
          style={{
            position: 'fixed',
            top: '50%',
            left: '2rem',
            transform: 'translateY(-50%)',
            backgroundColor: COLORS.brandPink,
            color: 'white',
            padding: '1rem 2rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            borderRadius: '9999px', // pill shape
            cursor: 'pointer',
          }}
        >
          ← Previous
        </button>
      )}

      {currentPageIndex < pages.length - 1 ? (
        <button
          onClick={() => setCurrentPageIndex(currentPageIndex + 1)}
          disabled={!allAnswered}
          style={{
            position: 'fixed',
            top: '50%',
            right: '2rem',
            transform: 'translateY(-50%)',
            backgroundColor: allAnswered
              ? COLORS.brandGreen
              : COLORS.buttonDisabled,
            color: 'white',
            padding: '1rem 2rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            borderRadius: '9999px',
            cursor: allAnswered ? 'pointer' : 'not-allowed',
          }}
        >
          Next →
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          style={{
            position: 'fixed',
            top: '50%',
            right: '2rem',
            transform: 'translateY(-50%)',
            backgroundColor: allAnswered
              ? COLORS.brandGreen
              : COLORS.buttonDisabled,
            color: 'white',
            padding: '1rem 2rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            borderRadius: '9999px',
            cursor: allAnswered ? 'pointer' : 'not-allowed',
          }}
        >
          Submit
        </button>
      )}
    </div>
  )
}

export default UserSurvey
