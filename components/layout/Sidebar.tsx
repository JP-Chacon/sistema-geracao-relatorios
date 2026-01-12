'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export function Sidebar() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Relatórios</h1>
      </div>

      <nav className="flex-1 p-4">
        <button
          onClick={() => router.push('/relatorios')}
          className={`w-full text-left px-4 py-2 rounded-lg mb-2 transition-colors ${
            pathname === '/relatorios'
              ? 'bg-primary-600 text-white'
              : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          Meus Relatórios
        </button>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="mb-4">
          <p className="text-sm text-gray-400">Usuário</p>
          <p className="text-white font-medium">
            {session?.user?.name || session?.user?.email}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full text-white border-gray-700 hover:bg-gray-800"
        >
          Sair
        </Button>
      </div>
    </div>
  )
}













