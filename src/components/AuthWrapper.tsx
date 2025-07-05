import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

interface AuthWrapperProps {
  children: (user: User) => React.ReactNode;
}

function LoginForm() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-500/20 p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border border-green-500/30 flex items-center justify-center">
          <img 
            src={theme === 'light' ? "/Cyber Scraper - Project Logo - BW.png" : "/Cyber Scraper - Project Logo.png"}
            alt="Cyber Scraper Logo" 
            className="w-12 h-12 object-cover rounded-full"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {isSignUp ? 'Sign up to start scraping websites' : 'Sign in to access your scraped results'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-green-600 dark:text-green-300 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-green-500/30 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-green-600 dark:text-green-300 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-green-500/30 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter your password"
            required
            minLength={6}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={authLoading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center"
        >
          {authLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 text-sm font-medium"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <ThemeProvider user={null}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black dark:from-gray-900 dark:to-black bg-white dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
            <p className="text-gray-300 dark:text-gray-300 text-gray-600">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider user={null}>
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-black flex items-center justify-center">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <LoginForm />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider user={user}>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-black">
        {/* Auth Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-green-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-end h-12">
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      
        {children(user)}
      </div>
    </ThemeProvider>
  );
}