import React, { useEffect, useState, useRef } from 'react'
const baseURL = import.meta.env.VITE_API_BASE_URL

const EditSurvey = () => {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const debounceTimers = useRef({})
  const dirtyPageIds = useRef(new Set())

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

  // Sync modified pages (throttled to avoid double-updates)
  useEffect(() => {
    const sync = async () => {
      for (const pageId of dirtyPageIds.current) {
        const page = pages.find(p => p._id === pageId)
        if (page) {
          await fetch(`${baseURL}/admin/page/${pageId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions: page.questions })
          })
        }
      }
      dirtyPageIds.current.clear()
    }

    const timer = setTimeout(sync, 500)
    return () => clearTimeout(timer)
  }, [pages]) // Triggers only when pages change

  const handleEdit = (pageId, qIndex, field, value) => {
    setPages(prev => {
      const updated = [...prev]
      const page = updated.find(p => p._id === pageId)
      if (page) page.questions[qIndex][field] = value
      return updated
    })
    dirtyPageIds.current.add(pageId)
  }

  const addQuestion = async (pageId) => {
    // Step 1: Clone the pages array safely
    const updatedPages = pages.map(p => {
      if (p._id === pageId) {
        return {
          ...p,
          questions: [...p.questions, { chineseText: '', englishText: '' }]
        }
      }
      return p
    })
  
    // Step 2: Update React state
    setPages(updatedPages)
  
    // Step 3: Find the updated page again from the local clone (not the original state)
    const updatedPage = updatedPages.find(p => p._id === pageId)
  
    // Step 4: Save it to backend
    if (updatedPage) {
      await fetch(`${baseURL}/admin/page/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: updatedPage.questions })
      })
    }
  }
  

  const removeQuestion = async (pageId, qIndex) => {
    const updated = [...pages]
    const page = updated.find(p => p._id === pageId)
    if (!page) return
    page.questions.splice(qIndex, 1)

    await fetch(`${baseURL}/admin/page/${pageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: page.questions })
    })

    setPages(updated)
  }

  const deletePage = async (pageId) => {
    if (!confirm('Are you sure you want to delete this page?')) return
    await fetch(`${baseURL}/admin/page/${pageId}`, {
      method: 'DELETE'
    })
    fetchPages()
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
          <details key={page._id} className="border rounded bg-gray-50 p-4 relative">
            <summary className="cursor-pointer text-lg font-medium text-gray-800 mb-4">
              {page.title}
            </summary>

            <button
              onClick={() => deletePage(page._id)}
              className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition shadow"
            >
              删除页面 (Delete Page)
            </button>

            <div className="mt-4 space-y-5">
              {page.questions.map((q, index) => (
                <div key={index} className="relative space-y-2">
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
                      className="absolute top-1/2 -translate-y-1/2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center transition"
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
                className="text-sm text-blue-700 hover:text-black font-medium mt-3 inline-flex items-center gap-1 transition"
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
