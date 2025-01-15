// client/src/pages/Login.tsx
import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (error: any) {
      setPassword('');
      
      // Get error message from response data
      const errorMessage = error.response?.data?.message || "Failed to sign in";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-8 w-8" />
              <h1 className="text-3xl md:text-4xl font-bold">
                Growth Hub
                <span className="bg-white/10 ml-2 px-2 rounded-lg">CFA</span>
              </h1>
            </div>
            <p className="text-white/80 text-center text-lg">Empowering Team Member Development</p>
          </div>
        </div>
        
        <Card className="bg-white rounded-[20px] shadow-md">
          <CardHeader>
            <CardTitle className="text-[#27251F] text-xl text-center">Sign in to your account</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-[#E51636]/10 border border-[#E51636]/20 text-[#E51636] rounded-xl text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#27251F]/60">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="mt-2 block w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#27251F]/60">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="mt-2 block w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#E51636] hover:bg-[#E51636]/90 text-white h-12"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="flex flex-col items-center gap-3 text-sm">
                <Link
                  to="/register"
                  className="font-medium text-[#E51636] hover:text-[#E51636]/90"
                >
                  Don't have an account? Register
                </Link>
                <Link
                  to="/forgot-password"
                  className="font-medium text-[#E51636] hover:text-[#E51636]/90"
                >
                  Forgot password?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}