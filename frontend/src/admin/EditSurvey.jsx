import React, { useEffect, useState, useRef } from 'react'

const baseURL = import.meta.env.VITE_API_BASE_URL

const EditSurvey = () => {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingQuestionId, setAddingQuestionId] = useState(null)
  const [selectedPages, setSelectedPages] = useState([])
  const [selectAll, setSelectAll] = useState(false)

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
        const page = pages.find((p) => p._id === pageId)
        if (page) {
          await fetch(`${baseURL}/admin/page/${pageId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions: page.questions }),
          })
        }
      }
      dirtyPageIds.current.clear()
    }

    const timer = setTimeout(sync, 500)
    return () => clearTimeout(timer)
  }, [pages])

  const handleEdit = (pageId, qIndex, field, value) => {
    setPages((prev) => {
      const updated = [...prev]
      const page = updated.find((p) => p._id === pageId)
      if (page) {
        page.questions[qIndex][field] = value
      }
      return updated
    })
    dirtyPageIds.current.add(pageId)
  }

  const addQuestion = async (pageId) => {
    if (addingQuestionId === pageId) return

    try {
      setAddingQuestionId(pageId)
      const updatedPages = pages.map((p) => {
        if (p._id === pageId) {
          return {
            ...p,
            questions: [...p.questions, { chineseText: '', englishText: '' }],
          }
        }
        return p
      })
      setPages(updatedPages)

      const updatedPage = updatedPages.find((p) => p._id === pageId)
      if (updatedPage) {
        await fetch(`${baseURL}/admin/page/${pageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: updatedPage.questions }),
        })
      }
    } finally {
      setAddingQuestionId(null)
    }
  }

  const removeQuestion = async (pageId, qIndex) => {
    const updated = [...pages]
    const page = updated.find((p) => p._id === pageId)
    if (!page) return
    page.questions.splice(qIndex, 1)

    await fetch(`${baseURL}/admin/page/${pageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: page.questions }),
    })

    setPages(updated)
  }

  const deletePage = async (pageId) => {
    if (!confirm('Are you sure you want to delete this page?')) return
    await fetch(`${baseURL}/admin/page/${pageId}`, { method: 'DELETE' })
    fetchPages() // refresh after single-page delete
  }

  // Multi-delete logic
  const handleSelectPage = (pageId) => {
    setSelectedPages((prev) => {
      if (prev.includes(pageId)) {
        return prev.filter((id) => id !== pageId)
      } else {
        return [...prev, pageId]
      }
    })
  }

  const handleSelectAll = (checked) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedPages(pages.map((p) => p._id))
    } else {
      setSelectedPages([])
    }
  }

  const deleteSelectedPages = async () => {
    if (!selectedPages.length) return
    if (!confirm('Are you sure you want to delete the selected pages?')) return

    for (const pageId of selectedPages) {
      await fetch(`${baseURL}/admin/page/${pageId}`, { method: 'DELETE' })
    }
    setSelectedPages([])
    setSelectAll(false)
    fetchPages() // refresh after multi-delete
  }

  return (
    <div className="relative min-h-screen">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray bg-opacity-60 backdrop-blur-sm z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-75" />
        </div>
      )}

      <div className={`${loading ? 'blur-sm pointer-events-none select-none' : ''} space-y-4 p-4`}>
        {/* multi-delete controls */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <span className="text-sm">全选 (Select All)</span>
          </label>

          <button
            onClick={deleteSelectedPages}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded transition shadow disabled:opacity-50"
            disabled={!selectedPages.length}
          >
            批量删除 (Delete Selected)
          </button>
        </div>

        {pages.map((page) => (
          <details key={page._id} className="border rounded bg-gray-50 p-4">
            {/* 
              We combine the page title, per-page checkbox, and delete button
              into a single row, so the user can see them clearly without overlap
            */}
            <summary className="cursor-pointer text-lg font-medium text-gray-800 mb-4 flex items-center justify-between">
              <span>{page.title}</span>

              <div className="flex items-center space-x-3">
                {/* Per-page checkbox for multi-delete */}
                <label className="flex items-center space-x-1" title="Select page for multi-delete">
                  <input
                    type="checkbox"
                    checked={selectedPages.includes(page._id)}
                    onChange={() => handleSelectPage(page._id)}
                  />
                  <span className="text-xs text-gray-600">选择</span>
                </label>

                <button
                  onClick={(e) => {
                    e.stopPropagation() // don't toggle details when clicking button
                    deletePage(page._id)
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition shadow"
                >
                  删除页面 (Delete Page)
                </button>
              </div>
            </summary>

            <div className="mt-4 space-y-5">
              {page.questions.map((q, index) => (
                <div key={index} className="relative space-y-2">
                  <div className="relative">
                    <input
                      className="w-full border px-4 py-2 rounded focus:outline-none text-sm text-gray-700 pr-10"
                      value={q.chineseText}
                      onChange={(e) => handleEdit(page._id, index, 'chineseText', e.target.value)}
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
                    onChange={(e) => handleEdit(page._id, index, 'englishText', e.target.value)}
                    placeholder="English question"
                  />
                </div>
              ))}

              <button
                onClick={() => addQuestion(page._id)}
                disabled={addingQuestionId === page._id}
                className="text-sm text-blue-700 hover:text-black font-medium mt-3 inline-flex items-center gap-1 transition disabled:opacity-50"
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
