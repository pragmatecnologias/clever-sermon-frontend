'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Plus, FileText, LogOut } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token) {
      router.push('/login')
      return
    }

    if (userData) {
      setUser(JSON.parse(userData))
    }

    fetchWorkspaces(token)
  }, [router])

  const fetchWorkspaces = async (token: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setWorkspaces(response.data)
    } catch (error) {
      console.error('Failed to fetch workspaces', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const createWorkspace = () => {
    router.push('/workspace/new')
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-black/40 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">Mission Control</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-cyan-200/80 text-sm">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={() => router.push('/theology-map')}
              className="cyber-outline px-4 py-2 text-xs rounded-full"
            >
              Theology Map
            </button>
            <button
              onClick={() => router.push('/sermon-dna')}
              className="cyber-outline px-4 py-2 text-xs rounded-full"
            >
              Sermon DNA
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-xs text-gray-100/80 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Workspaces</p>
            <h2 className="text-3xl font-bold">My Workspaces</h2>
          </div>
          <button
            onClick={createWorkspace}
            className="cyber-button flex items-center gap-2 px-6 py-3 rounded-full"
          >
            <Plus className="w-5 h-5" />
            New Workspace
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-12 cyber-panel rounded-2xl">
            <FileText className="w-16 h-16 text-cyan-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No workspaces yet
            </h3>
            <p className="text-gray-200/80 mb-6">
              Create your first sermon workspace to get started
            </p>
            <button
              onClick={createWorkspace}
              className="cyber-button px-6 py-3 rounded-full"
            >
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace: any) => (
              <div
                key={workspace.id}
                onClick={() => router.push(`/workspace/${workspace.id}`)}
                className="cyber-panel p-6 rounded-2xl hover:shadow-[0_0_20px_rgba(0,231,255,0.2)] transition cursor-pointer"
              >
                <h3 className="text-xl font-semibold mb-2">{workspace.title}</h3>
                <p className="text-cyan-200/80 mb-4">{workspace.mainPassage}</p>
                {workspace.theme && (
                  <p className="text-sm text-gray-200/80">Theme: {workspace.theme}</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-300">
                    {new Date(workspace.createdAt).toLocaleDateString()}
                  </span>
                  <span className="cyber-tag">{workspace.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
