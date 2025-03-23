import React, { useEffect, useState } from 'react'
const baseURL = import.meta.env.VITE_API_BASE_URL

const EditSurvey = () => {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true) // 🔹 loading state

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

  const handleEdit = async (pageId, qIndex, field, value) => {
    const page = pages.find(p => p._id === pageId)
    page.questions[qIndex][field] = value

    await fetch(`${baseURL}/admin/page/${pageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: page.questions })
    })

    fetchPages()
  }

  return (
    <div className="relative min-h-screen">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 backdrop-blur-sm z-50">
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
                <div key={index} className="space-y-1">
                  <input
                    className="w-full border px-4 py-2 rounded focus:outline-none"
                    value={q.chineseText}
                    onChange={(e) =>
                      handleEdit(page._id, index, 'chineseText', e.target.value)
                    }
                    placeholder="中文问题 (Chinese)"
                  />
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
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

export default EditSurvey
