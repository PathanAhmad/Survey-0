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
    info.school

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
      setInfo({ name: '', age: '', gender: '', school: '' })
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
          relative
        "
        style={{
          backgroundImage: `url('Images/Flowers.gif')`,
          backgroundColor: COLORS.floralBg,
          color: COLORS.textBase,
        }}
      >
        {/* Button in the top-right corner, redirect to /admin */}
        <button
          onClick={() => {
            window.location.href = '/admin'
          }}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            backgroundColor: COLORS.brandPink,
            color: 'white',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Admin
        </button>

        <div className="pt-60 px-6 w-full max-w-md mx-auto flex flex-col items-center">
          <h2
            className="text-3xl font-bold mb-4 text-center"
            style={{ color: COLORS.heading }}
          >
            请填写以下信息
            <br />
            <span
              style={{
                fontSize: '1.2rem',
                color: '#888',
                fontWeight: 'normal',
              }}
            >
              (Please fill out this form)
            </span>
          </h2>

          <input
            placeholder="姓名 (Name)"
            value={info.name}
            onChange={(e) => setInfo({ ...info, name: e.target.value })}
            className="
              w-full
              mb-3
              text-base
              border-b border-gray-300
              focus:outline-none
              focus:border-pink-500
              transition-colors
              py-3 px-3
              placeholder-gray-500
            "
            style={{
              color: COLORS.textBase,
              backgroundColor: 'white',
            }}
          />

          <input
            type="number"
            min="0"
            placeholder="年龄 (Age)"
            value={info.age}
            onChange={handleAgeChange}
            className="
              w-full
              mb-1
              text-base
              border-b border-gray-300
              focus:outline-none
              focus:border-pink-500
              transition-colors
              py-3 px-3
              placeholder-gray-500
            "
            style={{
              color: COLORS.textBase,
              backgroundColor: 'white',
            }}
          />
          {ageError && (
            <p className="text-red-600 text-sm mb-3">{ageError}</p>
          )}

          <input
            placeholder="性别 (Gender)"
            value={info.gender}
            onChange={(e) => setInfo({ ...info, gender: e.target.value })}
            className="
              w-full
              mb-3
              text-base
              border-b border-gray-300
              focus:outline-none
              focus:border-pink-500
              transition-colors
              py-3 px-3
              placeholder-gray-500
            "
            style={{
              color: COLORS.textBase,
              backgroundColor: 'white',
            }}
          />

          <input
            placeholder="学校 (School)"
            value={info.school}
            onChange={(e) => setInfo({ ...info, school: e.target.value })}
            className="
              w-full
              mb-3
              text-base
              border-b border-gray-300
              focus:outline-none
              focus:border-pink-500
              transition-colors
              py-3 px-3
              placeholder-gray-500
            "
            style={{
              color: COLORS.textBase,
              backgroundColor: 'white',
            }}
          />

          <button
            className="mt-2 px-6 py-2 rounded text-white font-semibold transition-all"
            style={{
              backgroundColor: isFormValid ? COLORS.buttonBg : COLORS.buttonDisabled,
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
  const allAnswered = page?.questions.every((_, i) => responses[`${page._id}|${i}`])

  return (
    <div
      className="
        min-h-screen w-screen bg-cover bg-center bg-no-repeat
        flex flex-col items-start justify-start
        relative
      "
      style={{
        backgroundColor: COLORS.floralBg,
        color: COLORS.textBase,
      }}
    >
      <button
        onClick={() => {
          // exit the survey => step=0
          setStep(0)
          setPages([])
          setResponses({})
          setCurrentPageIndex(0)
          setActiveQuestionIndex({})
        }}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          backgroundColor: COLORS.brandPink,
          color: 'white',
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Exit
      </button>

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
            // 1) More vertical spacing => changed mb-6 to mb-10
            <div
              className={`mb-10 flex flex-col items-center text-center ${isDisabled}`}
              key={index}
            >
              {/* 2) Increase Chinese text size from text-lg to text-xl */}
              <p
                className="text-xl font-semibold"
                style={{ color: COLORS.heading }}
              >
                {q.chineseText}
              </p>
              {/* Also increase the English text size from default to text-lg */}
              <p className="mb-2 text-lg" style={{ color: COLORS.muted }}>
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
            borderRadius: '9999px',
            cursor: 'pointer',
          }}
        >
          ← Previous
        </button>
      )}

      {currentPageIndex < pages.length - 1 ? (
        <button
          onClick={() => setCurrentPageIndex(currentPageIndex + 1)}
          disabled={!page?.questions.every((_, i) => responses[`${page._id}|${i}`])}
          style={{
            position: 'fixed',
            top: '50%',
            right: '2rem',
            transform: 'translateY(-50%)',
            backgroundColor: page?.questions.every((_, i) => responses[`${page._id}|${i}`])
              ? COLORS.brandGreen
              : COLORS.buttonDisabled,
            color: 'white',
            padding: '1rem 2rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            borderRadius: '9999px',
            cursor: page?.questions.every((_, i) => responses[`${page._id}|${i}`])
              ? 'pointer'
              : 'not-allowed',
          }}
        >
          Next →
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!page?.questions.every((_, i) => responses[`${page._id}|${i}`])}
          style={{
            position: 'fixed',
            top: '50%',
            right: '2rem',
            transform: 'translateY(-50%)',
            backgroundColor: page?.questions.every((_, i) => responses[`${page._id}|${i}`])
              ? COLORS.brandGreen
              : COLORS.buttonDisabled,
            color: 'white',
            padding: '1rem 2rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            borderRadius: '9999px',
            cursor: page?.questions.every((_, i) => responses[`${page._id}|${i}`])
              ? 'pointer'
              : 'not-allowed',
          }}
        >
          Submit
        </button>
      )}
    </div>
  )
}

export default UserSurvey
