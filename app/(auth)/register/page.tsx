import { RegisterForm } from '@/components/auth/RegisterForm'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4 bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: "url('/auth-bg.png')" }}
    >
      {/* Overlay para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/40 to-black/55" />

      <div className="relative z-10 w-full flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border border-white/10 animate-fade-in">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Cadastro</h1>
          <RegisterForm />
          <p className="mt-4 text-center text-sm text-gray-600">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary-600 hover:underline font-medium">
              Faça login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}










