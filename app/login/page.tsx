'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        // Fetch the session to get user role
        const response = await fetch('/api/auth/session');
        const session = await response.json();

        // Redirect based on user role
        if (session?.user?.roles?.some((role: any) => role.name === 'Admin')) {
          router.push('/admin');
        } else if (session?.user?.roles?.some((role: any) => role.name === 'Teacher')) {
          router.push('/lms');
        } else if (session?.user?.roles?.some((role: any) => role.name === 'Parent')) {
          router.push('/parent');
        } else if (session?.user?.roles?.some((role: any) => role.name === 'Student')) {
          router.push('/lms');
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-500 to-sky-700 px-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-white/10 -top-40 -right-40 blur-3xl" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-white/10 bottom-0 -left-40 blur-3xl" />
      </div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-gray-900">Robotics Academy</h1>
          </Link>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all text-gray-900 bg-white"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              {...register('password', { required: 'Password is required' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all text-gray-900 bg-white"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-500 text-white py-3 px-4 rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center"
          >
            {isLoading ? (
              'Signing in...'
            ) : (
              <>
                Sign In
                <LogIn className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link href="/join" className="text-sky-500 hover:text-sky-600 font-medium">
              Join now
            </Link>
          </p>
          <Link href="/" className="text-gray-500 hover:text-sky-500 text-sm font-medium block">
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
