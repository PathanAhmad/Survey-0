import React, { useState } from 'react'

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()

    const validLogins = [
      { username: 'sarahundre12', password: 'YxnGx10yUe2x' },
      { username: 'scott', password: 'Scott123' }
    ]

    const isValid = validLogins.some(
      (user) => user.username === username && user.password === password
    )

    if (isValid) {
      onLogin()
    } else {
      setError('用户名或密码错误 (Invalid username or password)')
    }
  }

  const isFormValid = username && password

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">管理员登录 (Admin Login)</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-sm">用户名 (Username)</label>
            <input
              type="text"
              placeholder="请输入用户名 (e.g. admin123)"
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">密码 (Password)</label>
            <input
              type="password"
              placeholder="请输入密码 (e.g. ********)"
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-1 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-2 px-4 rounded font-medium text-black transition ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-300 cursor-not-allowed'
            }`}
          >
            登录 (Login)
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
