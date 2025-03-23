import React, { useState } from 'react'
const baseURL = import.meta.env.VITE_API_BASE_URL

const CreateSurvey = ({ onSuccess }) => {
  const [pages, setPages] = useState([])

  const addPage = () => setPages([...pages, { title: '', questions: [] }])

  const updatePageTitle = (index, value) => {
    const updated = [...pages]
    updated[index].title = value
    setPages(updated)
  }

  const addQuestion = (pageIndex) => {
    const updated = [...pages]
    updated[pageIndex].questions.push({ chineseText: '', englishText: '' })
    setPages(updated)
  }

  const updateQuestion = (pageIndex, questionIndex, field, value) => {
    const updated = [...pages]
    updated[pageIndex].questions[questionIndex][field] = value
    setPages(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    for (const page of pages) {
      const res = await fetch(`${baseURL}/admin/page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: page.title })
      })
      const savedPage = await res.json()
      for (const q of page.questions) {
        await fetch(`${baseURL}/admin/page/${savedPage._id}/question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(q)
        })
      }
    }
    alert('Survey created successfully!')
    setPages([])
    onSuccess && onSuccess()
  }

  return (
    <div className="space-y-8">
      {/* Add Page Button */}
      <div className="flex justify-end">
        <button
          onClick={addPage}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded shadow transition"
        >
          + 添加页面 (Add Page)
        </button>
      </div>

      {/* Survey Pages */}
      {pages.map((page, pageIndex) => (
        <div
          key={pageIndex}
          className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5"
        >
          {/* Page Title */}
          <div>
            <label className="block text-sm font-medium  mb-1">
              页面标题 (Page Title)
            </label>
            <input
              type="text"
              placeholder="请输入页面标题 (Enter title)"
              className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
              value={page.title}
              onChange={(e) => updatePageTitle(pageIndex, e.target.value)}
            />
          </div>

          {/* Add Question */}
          <div>
            <button
              onClick={() => addQuestion(pageIndex)}
              className="text-sm text-green-600 hover:underline"
            >
              + 添加问题 (Add Question)
            </button>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {page.questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-2"
              >
                <input
                  type="text"
                  placeholder="问题内容 - 中文 (Chinese)"
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                  value={q.chineseText}
                  onChange={(e) =>
                    updateQuestion(pageIndex, qIndex, 'chineseText', e.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder="问题内容 - English"
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                  value={q.englishText}
                  onChange={(e) =>
                    updateQuestion(pageIndex, qIndex, 'englishText', e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save Button */}
      {pages.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md shadow transition"
          >
            保存问卷 (Save Survey)
          </button>
        </div>
      )}
    </div>
  )
}

export default CreateSurvey
