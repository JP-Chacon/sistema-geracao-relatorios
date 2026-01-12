import { LoginForm } from '@/components/auth/LoginForm'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4 bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: "url('/auth-bg.png')" }}
    >
      {/* Overlay para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/40 to-black/55" />

      <div className="relative z-10 w-full flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border border-white/10 animate-fade-in">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Login</h1>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-gray-600">
            Não tem conta?{' '}
            <Link href="/register" className="text-primary-600 hover:underline font-medium">
              Cadastre-se
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}










