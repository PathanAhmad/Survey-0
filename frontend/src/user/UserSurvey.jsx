import React, { useState, useEffect } from 'react'

const UserSurvey = () => {
  const [info, setInfo] = useState({
    name: '', age: '', gender: '', school: '', robot: false
  })
  const [step, setStep] = useState(0)
  const [pages, setPages] = useState([])
  const [responses, setResponses] = useState({})
  const [activeQuestionIndex, setActiveQuestionIndex] = useState({})
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  const isFormValid = info.name && info.age && info.gender && info.school && info.robot

  useEffect(() => {
    if (step === 1) {
      fetch('http://localhost:5000/api/admin/pages')
        .then(res => res.json())
        .then(data => {
          setPages(data)
          const initialActive = {}
          data.forEach(page => {
            initialActive[page._id] = 0
          })
          setActiveQuestionIndex(initialActive)
        })
        .catch(err => {
          console.error('Error fetching survey pages:', err)
          alert('问卷加载失败 (Failed to load survey)')
        })
    }
  }, [step])

  const handleRadio = (pageId, index, value) => {
    const key = `${pageId}|${index}`
    setResponses(prev => ({
      ...prev,
      [key]: value
    }))
    setActiveQuestionIndex(prev => {
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
            selectedValue
          })
        }
      })
    }
  
    const payload = {
      name: info.name,
      age: info.age,
      gender: info.gender,
      school: info.school,
      answers
    }
  
    try {
      await fetch('http://localhost:5000/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
  
      alert('提交成功！(Submitted successfully!)')
      setStep(0)
      setInfo({ name: '', age: '', gender: '', school: '', robot: false })
      setResponses({})
      setCurrentPageIndex(0)
      setActiveQuestionIndex({})
    } catch (err) {
      console.error('Submission failed:', err)
      alert('提交失败，请重试 (Submission failed)')
    }
  }
  


  if (step === 0) {
    return (
     <div className="min-h-screen w-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-xl p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 text-center">填写您的信息</h2>
          <h2 className="text-2xl font-semibold text-gray-400 text-center">Fill in your information</h2>
          <div className="space-y-4 text-sm text-gray-700">
            {['name', 'age', 'gender', 'school'].map((field, idx) => (
              <div key={idx}>
                <label className="block mb-1 font-medium text-lg">{field === 'name' ? '姓名 (Name)' : field === 'age' ? '年龄 (Age)' : field === 'gender' ? '性别 (Gender)' : '学校 (School)'}</label>
                <input
                  type={field === 'age' ? 'number' : 'text'}
                  placeholder={
                    field === 'name' ? '例如：李雷 (e.g. Li Lei)' :
                    field === 'age' ? '例如: (e.g. 20)' :
                    field === 'gender' ? '例如：男 / 女 (e.g. Male / Female)' :
                    '例如：悦谷学习社区 (e.g. Yuegu Learning Community)'
                  }
                  className="w-full border border-gray-300 rounded px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  value={info[field]}
                  onChange={(e) => setInfo({ ...info, [field]: e.target.value })}
                />
              </div>
            ))}
            <label className="flex items-center gap-2 text-gray-600 mt-2">
              <input
                type="checkbox"
                checked={info.robot}
                onChange={(e) => setInfo({ ...info, robot: e.target.checked })}
                className="w-4 h-4"
              />
              我不是机器人 (I'm not a robot)
            </label>
          </div>
          <button
            onClick={() => setStep(1)}
            disabled={!isFormValid}
            className={`w-full py-2 px-4 rounded font-medium text-white transition ${isFormValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
          >
            开始问卷 (Start Survey)
          </button>
        </div>
      </div>
    )
  }

  const page = pages[currentPageIndex]
  const allAnswered = page?.questions.every((_, index) => {
    const key = `${page._id}|${index}`
    return responses[key]
  })

  return (
    <div className="min-h-screen w-screen bg-white px-4 py-10">
      <div className="w-full max-w-[1200px] mx-auto bg-white rounded-xl p-6 space-y-8">
        <h2 className="text-xl font-bold text-center">问卷内容 (Survey Questions)</h2>

        {page && (
          <div className="space-y-0">
            <h1 className="text-3xl font-bold text-blue-800 text-center tracking-wide mb-6">{page.title}</h1>
            {page.questions.map((q, index) => {
              const key = `${page._id}|${index}`
              const isUnlocked = index <= (activeQuestionIndex[page._id] || 0)
              const isCurrent = index === (activeQuestionIndex[page._id] || 0)

              return (
                <React.Fragment key={index}>
                  <div
                    className={`bg-white rounded-xl px-6 py-[45px] space-y-4 transition-opacity ${
                      isUnlocked ? (isCurrent ? 'opacity-100' : 'opacity-50') : 'opacity-40 grayscale pointer-events-none'
                    }`}
                    style={{ minHeight: '225.6px' }}
                  >
                    <div className="text-center mb-4 space-y-1">
                      <p className="text-2xl font-semibold text-gray-800 leading-snug">{q.chineseText}</p>
                      <p className="text-2xl text-gray-500 italic">{q.englishText}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center mt-6">
                    <div className="flex items-center justify-center flex-wrap gap-4">
  <span className="text-base font-medium text-green-600 whitespace-nowrap">同意 (Agree)</span>

  <div className="flex items-center justify-center gap-4 ml-6">
    {[1, 2, 3, 4, 5, 6, 7].map((num) => {
      const sizeClass =
        num === 1 || num === 7 ? 'w-[70px] h-[70px]' :
        num === 2 || num === 6 ? 'w-[46px] h-[46px]' :
        num === 3 || num === 5 ? 'w-[38px] h-[38px]' : 'w-[26px] h-[26px]'

      const isSelected = responses[key] === num

      return (
        <label key={num} className="relative flex items-center justify-center">
          <input
            type="radio"
            name={key}
            value={num}
            checked={isSelected}
            onChange={() => handleRadio(page._id, index, num)}
            className={`peer appearance-none rounded-full cursor-pointer transition-all duration-200
              ${sizeClass} border-[3px]
              ${isSelected ? 'ring-2 ring-offset-1' : ''}
              ${num <= 3 ? 'border-[#33A474] hover:bg-[#33A474]' :
              num >= 5 ? 'border-[#88619A] hover:bg-[#88619A]' :
              'border-gray-400 hover:bg-gray-400'}
              ${isSelected ? (num <= 3 ? 'bg-[#33A474]' :
              num >= 5 ? 'bg-[#88619A]' : 'bg-gray-400') : ''}
            `}
          />
          <span
            className={`absolute text-white text-lg pointer-events-none select-none ${sizeClass}
              flex items-center justify-center transition-opacity duration-200
              peer-hover:opacity-100 ${isSelected ? 'opacity-100' : 'opacity-0'}
            `}
          >
            ✓
          </span>
        </label>
      )
    })}
  </div>

  <span className="text-base font-medium text-purple-600 whitespace-nowrap">不同意 (Disagree)</span>
</div>

                    </div>
                  </div>

                  {/* Line between question boxes */}
                  {index < page.questions.length - 1 && (
                    <hr className="border-t border-gray-300 my-10" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        )}

        <div className="flex justify-end gap-4">
          {currentPageIndex > 0 && (
            <button
              onClick={() => setCurrentPageIndex(currentPageIndex - 1)}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
            >
              上一页 (Previous)
            </button>
          )}
          {currentPageIndex < pages.length - 1 ? (
            <button
              onClick={() => setCurrentPageIndex(currentPageIndex + 1)}
              disabled={!allAnswered}
              className={`px-6 py-2 rounded text-white transition ${
                allAnswered
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-300 cursor-not-allowed opacity-60'
              }`}
              
            >
              下一页 (Next)
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`px-6 py-2 rounded text-white transition ${
                allAnswered ? 'bg-green-600 hover:bg-green-700' : 'bg-green-300 cursor-not-allowed'
              }`}
            >
              提交问卷 (Submit Survey)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserSurvey
