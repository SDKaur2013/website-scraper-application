import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  user: User | null;
}

export function ThemeProvider({ children, user }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isLoading, setIsLoading] = useState(true);

  // Load user's theme preference from database
  useEffect(() => {
    const loadThemePreference = async () => {
      if (!user) {
        // If no user, use system preference or default to dark
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setTheme(systemTheme);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('theme')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for new users
          console.error('Error loading theme preference:', error);
        }

        if (data?.theme) {
          setTheme(data.theme as Theme);
        } else {
          // Create default preference for new user
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          setTheme(systemTheme);
          
          // Save default preference to database
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              theme: systemTheme,
            });
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Fallback to system preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setTheme(systemTheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    if (isLoading) return;
    
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isLoading]);

  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    // Save preference to database if user is logged in
    if (user) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            theme: newTheme,
          });
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}