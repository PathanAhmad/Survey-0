import React, { useEffect, useState } from 'react'

const EditSurvey = () => {
  const [pages, setPages] = useState([])

  const fetchPages = async () => {
    const res = await fetch('http://localhost:5000/api/admin/pages')
    const data = await res.json()
    setPages(data)
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const handleEdit = async (pageId, qIndex, field, value) => {
    const page = pages.find(p => p._id === pageId)
    page.questions[qIndex][field] = value

    await fetch(`http://localhost:5000/api/admin/page/${pageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: page.questions })
    })

    fetchPages()
  }

  return (
    <div className="space-y-6">
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
  )
}

export default EditSurvey
