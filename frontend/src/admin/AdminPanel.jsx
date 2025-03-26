import React, { useState } from 'react'
import CreateSurvey from './CreateSurvey'
import EditSurvey from './EditSurvey'
import { motion, AnimatePresence } from 'framer-motion'

const AdminPanel = ({ onLogout }) => {
  const [tab, setTab] = useState(null)
  const hasSelected = tab !== null

  const renderContent = () => {
    if (tab === 'create') return <CreateSurvey />
    if (tab === 'edit') return <EditSurvey />
    return null
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center justify-start pt-20 px-4 relative">
      {/* Logout Button - Top Right Corner */}
      {hasSelected && (
        <button
          onClick={onLogout}
          className="fixed top-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-full shadow transition"
        >
          Logout
        </button>
      )}

      {/* Floating topbar */}
      <AnimatePresence>
        {hasSelected && (
          <motion.div
            key="topbar"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-40 bg-grey/90 px-10 py-6 flex gap-4"
          >
            <button
              onClick={() => setTab('create')}
              className={`px-4 py-1 rounded-full text-sm font-medium transition transform ${
                tab === 'create'
                  ? 'bg-blue-600 text-white shadow-md scale-120'
                  : 'bg-white text-gray-400 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Create
            </button>
            <button
              onClick={() => setTab('edit')}
              className={`px-4 py-1 rounded-full text-sm font-medium transition transform ${
                tab === 'edit'
                  ? 'bg-blue-600 text-white shadow-md scale-120'
                  : 'bg-white text-gray-400 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Edit
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content area */}
      <div className="w-full max-w-5xl p-8 space-y-6 relative overflow-visible min-h-[500px]">
        <AnimatePresence mode="wait">
          {!hasSelected && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6 py-10"
            >
              <h2 className="text-2xl font-semibold text-gray-800">
                What would you like to do?
              </h2>
              <div className="flex justify-center gap-6">
                <motion.button
                  layout
                  onClick={() => setTab('create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Create
                </motion.button>
                <motion.button
                  layout
                  onClick={() => setTab('edit')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Edit
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {hasSelected && (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4 }}
              className="pt-6"
            >
              {renderContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AdminPanel
