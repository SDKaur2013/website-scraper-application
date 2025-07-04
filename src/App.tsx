import React, { useState, useEffect } from 'react';
import { Globe, Search, BookOpen, Link, ExternalLink, Clock, Trash2, Eye, Loader2 } from 'lucide-react';

interface ScrapedResult {
  id: string;
  url: string;
  title: string;
  headings: string[];
  links: { text: string; url: string; }[];
  timestamp: string;
}

function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentResult, setCurrentResult] = useState<ScrapedResult | null>(null);
  const [savedResults, setSavedResults] = useState<ScrapedResult[]>([]);
  const [showSavedResults, setShowSavedResults] = useState(false);

  // Load saved results from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('scrapedResults');
    if (saved) {
      setSavedResults(JSON.parse(saved));
    }
  }, []);

  // Save results to localStorage whenever savedResults changes
  useEffect(() => {
    localStorage.setItem('scrapedResults', JSON.stringify(savedResults));
  }, [savedResults]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setCurrentResult(null);
    setShowSavedResults(false);

    try {
      // Simulate API call to Supabase backend
      // In a real implementation, this would be:
      // const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-website`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ url }),
      // });
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      const mockResult: ScrapedResult = {
        id: Date.now().toString(),
        url,
        title: `Sample Website - ${new URL(url).hostname}`,
        headings: [
          'Welcome to Our Website',
          'About Us',
          'Our Services',
          'Contact Information',
          'Latest News',
          'Product Features'
        ],
        links: [
          { text: 'Home', url: '/' },
          { text: 'About', url: '/about' },
          { text: 'Services', url: '/services' },
          { text: 'Contact', url: '/contact' },
          { text: 'Blog', url: '/blog' },
          { text: 'Privacy Policy', url: '/privacy' }
        ],
        timestamp: new Date().toISOString()
      };

      setCurrentResult(mockResult);
      setSavedResults(prev => [mockResult, ...prev]);
    } catch (err) {
      setError('Failed to scrape website. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSavedResults = () => {
    setSavedResults([]);
    setShowSavedResults(false);
  };

  const viewSavedResult = (result: ScrapedResult) => {
    setCurrentResult(result);
    setShowSavedResults(false);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WebScraper</h1>
                <p className="text-sm text-gray-500">Extract website content</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSavedResults(!showSavedResults)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                Saved Results ({savedResults.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* URL Input Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Search className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Scrape Website</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Link className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Scrape Website
                </>
              )}
            </button>
          </form>
        </div>

        {/* Saved Results Panel */}
        {showSavedResults && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Saved Results</h2>
              </div>
              {savedResults.length > 0 && (
                <button
                  onClick={clearSavedResults}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </button>
              )}
            </div>
            
            {savedResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No saved results yet. Scrape a website to get started!</p>
            ) : (
              <div className="grid gap-4">
                {savedResults.map((result) => (
                  <div
                    key={result.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => viewSavedResult(result)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{result.title}</h3>
                        <p className="text-sm text-blue-600 mb-2">{result.url}</p>
                        <p className="text-xs text-gray-500">{formatTimestamp(result.timestamp)}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scraped Results Display */}
        {currentResult && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Scraped Content</h2>
            </div>
            
            <div className="space-y-6">
              {/* Website Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{currentResult.title}</h3>
                <a
                  href={currentResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm inline-flex items-center"
                >
                  {currentResult.url}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
                <p className="text-xs text-gray-500 mt-2">
                  Scraped on {formatTimestamp(currentResult.timestamp)}
                </p>
              </div>

              {/* Headings */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Headings ({currentResult.headings.length})
                </h3>
                <div className="grid gap-2">
                  {currentResult.headings.map((heading, index) => (
                    <div
                      key={index}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700"
                    >
                      {heading}
                    </div>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></span>
                  Links ({currentResult.links.length})
                </h3>
                <div className="grid gap-2">
                  {currentResult.links.map((link, index) => (
                    <div
                      key={index}
                      className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-700">{link.text}</span>
                      <span className="text-xs text-emerald-600 font-mono">{link.url}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!currentResult && !showSavedResults && !isLoading && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Globe className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to scrape</h3>
            <p className="text-gray-500 mb-6">Enter a website URL above to extract its content</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;