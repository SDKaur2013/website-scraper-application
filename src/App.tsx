import React, { useState, useEffect } from 'react';
import { Globe, Search, BookOpen, Link, ExternalLink, Clock, Trash2, Eye, Loader2, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { AuthWrapper } from './components/AuthWrapper';
import { supabase } from './lib/supabase';

interface ScrapedResult {
  id: string;
  url: string;
  title: string;
  headings: string[];
  links: { text: string; url: string; }[];
  timestamp: string;
}

function WebScraperApp({ user }: { user: User }) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentResult, setCurrentResult] = useState<ScrapedResult | null>(null);
  const [savedResults, setSavedResults] = useState<ScrapedResult[]>([]);
  const [showSavedResults, setShowSavedResults] = useState(false);
  const [loadingSavedResults, setLoadingSavedResults] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    headings: true,
    links: true,
  });

  // Load saved results from Supabase
  const loadSavedResults = async () => {
    setLoadingSavedResults(true);
    try {
      const { data, error } = await supabase
        .from('scraped_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedResults: ScrapedResult[] = data.map(item => ({
        id: item.id,
        url: item.url,
        title: item.title || 'Untitled',
        headings: item.headings || [],
        links: item.links || [],
        timestamp: item.created_at,
      }));

      setSavedResults(formattedResults);
    } catch (error: any) {
      console.error('Error loading saved results:', error);
    } finally {
      setLoadingSavedResults(false);
    }
  };

  useEffect(() => {
    loadSavedResults();
  }, []);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const normalizeUrl = (inputUrl: string): string => {
    let normalizedUrl = inputUrl.trim();
    
    // If URL doesn't start with http:// or https://, add https://
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    return normalizedUrl;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Normalize the URL by adding protocol if missing
    const normalizedUrl = normalizeUrl(url);
    
    // Validate the normalized URL
    if (!validateUrl(normalizedUrl)) {
      setError('Please enter a valid URL (e.g., google.com, www.example.com, or https://example.com)');
      return;
    }

    // Update the input field with the normalized URL
    setUrl(normalizedUrl);

    setIsLoading(true);
    setCurrentResult(null);
    setShowSavedResults(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-website`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to scrape website');
      }

      const scrapedResult: ScrapedResult = {
        id: result.data.id,
        url: result.data.url,
        title: result.data.title,
        headings: result.data.headings,
        links: result.data.links,
        timestamp: result.data.timestamp,
      };

      setCurrentResult(scrapedResult);
      setSavedResults(prev => [scrapedResult, ...prev]);
      setSuccessMessage('Website scraped and saved successfully!');
      setUrl(''); // Clear the input after successful scrape
    } catch (err: any) {
      setError(err.message || 'Failed to scrape website. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSavedResults = async () => {
    try {
      const { error } = await supabase
        .from('scraped_results')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setSavedResults([]);
      setShowSavedResults(false);
      setSuccessMessage('All saved results cleared successfully!');
    } catch (error: any) {
      console.error('Error clearing saved results:', error);
      setError('Failed to clear saved results. Please try again.');
    }
  };

  const viewSavedResult = (result: ScrapedResult) => {
    setCurrentResult(result);
    setShowSavedResults(false);
    // Reset expanded sections when viewing a new result
    setExpandedSections({ headings: true, links: true });
  };

  const toggleSection = (section: 'headings' | 'links') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CyberScraper</h1>
                <p className="text-sm text-gray-500">Advanced website content extraction</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setShowSavedResults(!showSavedResults);
                  if (!showSavedResults) {
                    loadSavedResults();
                  }
                }}
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
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center animate-in slide-in-from-top-2 duration-300">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

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
                  type="text"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="google.com, www.example.com, or https://example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  ) : (
                    <Link className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600 animate-in slide-in-from-top-1 duration-200">{error}</p>
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

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8 animate-in fade-in duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Scraping Website</h3>
              <p className="text-gray-500">Extracting content from the webpage...</p>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Saved Results Panel */}
        {showSavedResults && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8 animate-in slide-in-from-top-4 duration-300">
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
            
            {loadingSavedResults ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-500">Loading saved results...</p>
              </div>
            ) : savedResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No saved results yet. Scrape a website to get started!</p>
            ) : (
              <div className="grid gap-4">
                {savedResults.map((result) => (
                  <div
                    key={result.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer group"
                    onClick={() => viewSavedResult(result)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{result.title}</h3>
                        <p className="text-sm text-blue-600 mb-2 truncate">{result.url}</p>
                        <p className="text-xs text-gray-500">{formatTimestamp(result.timestamp)}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 mt-1 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scraped Results Display */}
        {currentResult && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center space-x-3 mb-6">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Scraped Content</h2>
            </div>
            
            <div className="space-y-6">
              {/* Website Info */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">{currentResult.title}</h3>
                <a
                  href={currentResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm inline-flex items-center group"
                >
                  {currentResult.url}
                  <ExternalLink className="h-3 w-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
                <p className="text-xs text-gray-500 mt-2">
                  Scraped on {formatTimestamp(currentResult.timestamp)}
                </p>
              </div>

              {/* Headings */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('headings')}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                    Headings ({currentResult.headings.length})
                  </h3>
                  {expandedSections.headings ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </button>
                
                <div className={`transition-all duration-300 ease-in-out ${
                  expandedSections.headings 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                  <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    {currentResult.headings.length > 0 ? (
                      currentResult.headings.map((heading, index) => (
                        <div
                          key={index}
                          className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700 hover:bg-blue-100 transition-colors"
                        >
                          {heading}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No headings found</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('links')}
                  className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></span>
                    Links ({currentResult.links.length})
                  </h3>
                  {expandedSections.links ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </button>
                
                <div className={`transition-all duration-300 ease-in-out ${
                  expandedSections.links 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                  <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    {currentResult.links.length > 0 ? (
                      currentResult.links.map((link, index) => (
                        <div
                          key={index}
                          className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 hover:bg-emerald-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-700 hover:text-emerald-700 truncate flex-1 mr-3 font-medium hover:underline transition-colors group"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {link.text || link.url}
                            </a>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-emerald-600 font-mono truncate max-w-xs">{link.url}</span>
                              <ExternalLink className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No links found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!currentResult && !showSavedResults && !isLoading && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Globe className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to scrape</h3>
            <p className="text-gray-500 mb-6">Enter a website URL above to extract its content</p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Extract headings
              </div>
              <div className="flex items-center">
                <Link className="h-4 w-4 mr-2" />
                Find links
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Save results
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function App() {
  return (
    <AuthWrapper>
      {(user) => <WebScraperApp user={user} />}
    </AuthWrapper>
  );
}

export default App;