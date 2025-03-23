import React, { useEffect, useState, useRef } from 'react'
const baseURL = import.meta.env.VITE_API_BASE_URL

const EditSurvey = () => {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const debounceTimers = useRef({})

  const fetchPages = async () => {
    setLoading(true)
    const res = await fetch(`${baseURL}/admin/pages`)
    const data = await res.json()
    setPages(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const handleEdit = (pageId, qIndex, field, value) => {
    setPages(prevPages => {
      const updated = [...prevPages]
      const page = updated.find(p => p._id === pageId)
      if (page) {
        page.questions[qIndex][field] = value
      }
      return updated
    })

    const timerKey = `${pageId}-${qIndex}-${field}`
    if (debounceTimers.current[timerKey]) {
      clearTimeout(debounceTimers.current[timerKey])
    }

    debounceTimers.current[timerKey] = setTimeout(() => {
      const updatedPage = pages.find(p => p._id === pageId)
      if (updatedPage) {
        fetch(`${baseURL}/admin/page/${pageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: updatedPage.questions })
        })
      }
    }, 1000)
  }

  const addQuestion = (pageId) => {
    setPages(prevPages => {
      const updated = [...prevPages]
      const pageIndex = updated.findIndex(p => p._id === pageId)
      if (pageIndex !== -1) {
        updated[pageIndex].questions.push({ chineseText: '', englishText: '' })

        fetch(`${baseURL}/admin/page/${pageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: updated[pageIndex].questions })
        })
      }
      return updated
    })
  }

  const removeQuestion = async (pageId, qIndex) => {
    const updatedPages = [...pages]
    const page = updatedPages.find(p => p._id === pageId)
    if (!page) return

    page.questions = page.questions.filter((_, i) => i !== qIndex)

    await fetch(`${baseURL}/admin/page/${pageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: page.questions })
    })

    setPages(updatedPages)
  }

  return (
    <div className="relative min-h-screen">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray bg-opacity-60 backdrop-blur-sm z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-75"></div>
        </div>
      )}

      <div className={`${loading ? 'blur-sm pointer-events-none select-none' : ''} space-y-6`}>
        {pages.map(page => (
          <details key={page._id} className="border rounded bg-gray-50 p-4">
            <summary className="cursor-pointer text-lg font-medium text-gray-800">
              {page.title}
            </summary>

            <div className="mt-4 space-y-3">
              {page.questions.map((q, index) => (
                <div key={index} className="relative space-y-2 group">
                  <div className="relative">
                    <input
                      className="w-full border px-4 py-2 rounded focus:outline-none text-sm text-gray-700 pr-10"
                      value={q.chineseText}
                      onChange={(e) =>
                        handleEdit(page._id, index, 'chineseText', e.target.value)
                      }
                      placeholder="中文问题 (Chinese)"
                    />
                    <button
                      onClick={() => removeQuestion(page._id, index)}
                      className="absolute top-1/2 -translate-y-1/2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      title="删除问题 (Delete)"
                    >
                      ×
                    </button>
                  </div>

                  <input
                    className="w-full border px-4 py-2 rounded text-sm text-gray-700 focus:outline-none"
                    value={q.englishText}
                    onChange={(e) =>
                      handleEdit(page._id, index, 'englishText', e.target.value)
                    }
                    placeholder="English question"
                  />
                </div>
              ))}

              <button
                onClick={() => addQuestion(page._id)}
                className="text-sm text-white hover:text-black font-medium mt-3 inline-flex items-center gap-1 transition"
              >
                <span className="text-xl">＋</span> 添加问题 (Add Question)
              </button>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

export default EditSurvey
