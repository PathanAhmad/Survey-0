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

  // (3) Use a single hoveredKey state to track which circle is hovered
  const [hoveredKey, setHoveredKey] = useState(null)

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
        <img
          src="/Images/FullLogo.png"
          alt="Logo"
          className="
            fixed top-4 left-4 w-40 z-[9999] pointer-events-none
          "
        />
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
          className="text-3xl font-bold mb-4 text-center pb-16"
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
              key={index}
              // (2) More vertical spacing + thin gray line
              className={`mb-16 flex flex-col items-center text-center ${isDisabled} w-full border-b border-gray-300 pb-16`}
            >
              <p
                className="text-xl font-semibold"
                style={{ fontSize: "28px", color: COLORS.heading }}
              >
                {q.chineseText}
              </p>
              <p className="mb-4 text-lg pb-8" style={{ color: COLORS.muted }}>
                {q.englishText}
              </p>

              <div className="flex items-center justify-center space-x-3">
                <span className="text-sm text-green-500 text-m">同意 <br /> Agree</span>

                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  const circleKey = `${page._id}|${index}|${num}`
                  const isSelected = responses[key] === num

                  // We'll see if user is hovering on this circle:
                  const isHovered = hoveredKey === circleKey

                  let borderColor = '#888'
                  if (num <= 3) borderColor = COLORS.brandGreen
                  if (num >= 5) borderColor = COLORS.brandPurple

                  let baseBg = 'transparent'
                  if (isSelected) {
                    if (num <= 3) baseBg = COLORS.brandGreen
                    if (num >= 5) baseBg = COLORS.brandPurple
                    if (num === 4) baseBg = COLORS.brandGray
                  }

                  // if hovered, fill with border color
                  const finalBg = isHovered && !isSelected ? borderColor : baseBg

                  // if hovered or selected => show check
                  const showCheck = isHovered || isSelected

                  let size = 'w-6 h-6'
                  if (num === 1 || num === 7) size = 'w-12 h-12'
                  if (num === 2 || num === 6) size = 'w-10 h-10'
                  if (num === 3 || num === 5) size = 'w-8 h-8'

                  return (
                    <label key={circleKey} className="cursor-pointer">
                      <input
                        type="radio"
                        name={key}
                        value={num}
                        checked={isSelected}
                        onChange={() => handleRadio(page._id, index, num)}
                        className="hidden"
                      />
                      <div
                        onMouseEnter={() => setHoveredKey(circleKey)}
                        onMouseLeave={() => setHoveredKey(null)}
                        className={`
                          rounded-full border-3 flex items-center justify-center
                          transition-all duration-300
                          ${size}
                        `}
                        style={{
                          borderColor,
                          backgroundColor: finalBg,
                        }}
                      >
                        {showCheck && (
                          <span className="text-white font-bold text-lg">
                            ✓
                          </span>
                        )}
                      </div>
                    </label>
                  )
                })}

                <span className="text-sm text-purple-500 text-m"> 不同意 <br /> Disagree</span>
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
          disabled={!allAnswered}
          style={{
            position: 'fixed',
            top: '50%',
            right: '2rem',
            transform: 'translateY(-50%)',
            backgroundColor: allAnswered ? COLORS.brandGreen : COLORS.buttonDisabled,
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
            backgroundColor: allAnswered ? COLORS.brandGreen : COLORS.buttonDisabled,
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
      <img
        src="/Images/FullLogo.png"
        alt="Logo"
        className="
          fixed top-4 left-4 w-40 z-[9999] pointer-events-none
        "
      />
    </div>
  )
}

export default UserSurvey
