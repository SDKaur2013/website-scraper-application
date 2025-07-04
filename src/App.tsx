import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Link, ExternalLink, Clock, Trash2, Eye, Loader2, CheckCircle, ChevronDown, ChevronUp, Square, CheckSquare, X } from 'lucide-react';
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
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [deletingResults, setDeletingResults] = useState<Set<string>>(new Set());
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
    if (!confirm('Are you sure you want to delete all saved results? This action cannot be undone.')) {
      return;
    }

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

  const deleteSelectedResults = async () => {
    if (selectedResults.size === 0) return;
    
    const count = selectedResults.size;
    if (!confirm(`Are you sure you want to delete ${count} selected result${count > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    setDeletingResults(new Set(selectedResults));
    
    try {
      const { error } = await supabase
        .from('scraped_results')
        .delete()
        .in('id', Array.from(selectedResults));

      if (error) throw error;

      setSavedResults(prev => prev.filter(result => !selectedResults.has(result.id)));
      setSelectedResults(new Set());
      setIsSelectionMode(false);
      setSuccessMessage(`${count} result${count > 1 ? 's' : ''} deleted successfully!`);
    } catch (error: any) {
      console.error('Error deleting selected results:', error);
      setError('Failed to delete selected results. Please try again.');
    } finally {
      setDeletingResults(new Set());
    }
  };

  const deleteIndividualResult = async (resultId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this result? This action cannot be undone.')) {
      return;
    }

    setDeletingResults(new Set([resultId]));
    
    try {
      const { error } = await supabase
        .from('scraped_results')
        .delete()
        .eq('id', resultId);

      if (error) throw error;

      setSavedResults(prev => prev.filter(result => result.id !== resultId));
      setSelectedResults(prev => {
        const newSet = new Set(prev);
        newSet.delete(resultId);
        return newSet;
      });
      setSuccessMessage('Result deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting result:', error);
      setError('Failed to delete result. Please try again.');
    } finally {
      setDeletingResults(prev => {
        const newSet = new Set(prev);
        newSet.delete(resultId);
        return newSet;
      });
    }
  };

  const toggleResultSelection = (resultId: string) => {
    setSelectedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedResults.size === savedResults.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(savedResults.map(result => result.id)));
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedResults(new Set());
  };

  const viewSavedResult = (result: ScrapedResult) => {
    if (isSelectionMode) {
      toggleResultSelection(result.id);
      return;
    }
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
      <header className="bg-gray-900 shadow-lg border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 border border-green-500/30">
                <img 
                  src="/public/Cyber Scraper - Project Logo.jpeg" 
                  alt="Cyber Scraper Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Cyber Scraper</h1>
                <p className="text-sm text-green-400">Advanced website content extraction</p>
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
                className="inline-flex items-center px-4 py-2 border border-green-500/30 rounded-lg text-sm font-medium text-green-400 bg-gray-800 hover:bg-gray-700 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
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
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center animate-in slide-in-from-top-2 duration-300">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
            <p className="text-green-300 font-medium">{successMessage}</p>
          </div>
        )}

        {/* URL Input Form */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-green-500/20 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Search className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Scrape Website</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-green-300 mb-2">
                Website URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="google.com, www.example.com, or https://example.com"
                  className="w-full px-4 py-3 bg-gray-700 border border-green-500/30 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 outline-none transition-all text-white placeholder-gray-400"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 text-green-400 animate-spin" />
                  ) : (
                    <Link className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-400 animate-in slide-in-from-top-1 duration-200">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          <div className="bg-gray-800 rounded-xl shadow-lg border border-green-500/20 p-8 mb-8 animate-in fade-in duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Scraping Website</h3>
              <p className="text-gray-300">Extracting content from the webpage...</p>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Saved Results Panel */}
        {showSavedResults && (
          <div className="bg-gray-800 rounded-xl shadow-lg border border-green-500/20 p-6 mb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-green-400" />
                <h2 className="text-lg font-semibold text-white">Saved Results</h2>
               {savedResults.length > 0 && (
                 <span className="text-sm text-gray-400">
                   {isSelectionMode && selectedResults.size > 0 && `(${selectedResults.size} selected)`}
                 </span>
               )}
              </div>
             {savedResults.length > 0 && (
               <div className="flex items-center space-x-2">
                 {isSelectionMode ? (
                   <>
                     <button
                       onClick={toggleSelectAll}
                       className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                     >
                       {selectedResults.size === savedResults.length ? (
                         <CheckSquare className="h-4 w-4 mr-2" />
                       ) : (
                         <Square className="h-4 w-4 mr-2" />
                       )}
                       {selectedResults.size === savedResults.length ? 'Deselect All' : 'Select All'}
                     </button>
                     {selectedResults.size > 0 && (
                       <button
                         onClick={deleteSelectedResults}
                         disabled={deletingResults.size > 0}
                         className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                       >
                         {deletingResults.size > 0 ? (
                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                         ) : (
                           <Trash2 className="h-4 w-4 mr-2" />
                         )}
                         Delete Selected ({selectedResults.size})
                       </button>
                     )}
                     <button
                       onClick={exitSelectionMode}
                       className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                     >
                       <X className="h-4 w-4 mr-2" />
                       Cancel
                     </button>
                   </>
                 ) : (
                   <>
                     <button
                       onClick={() => setIsSelectionMode(true)}
                       className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                     >
                       <CheckSquare className="h-4 w-4 mr-2" />
                       Select
                     </button>
                     <button
                       onClick={clearSavedResults}
                       className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                     >
                       <Trash2 className="h-4 w-4 mr-2" />
                       Clear All
                     </button>
                   </>
                 )}
               </div>
              )}
            </div>
            
            {loadingSavedResults ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-green-400 mx-auto mb-2" />
                <p className="text-gray-300">Loading saved results...</p>
              </div>
            ) : savedResults.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No saved results yet. Scrape a website to get started!</p>
            ) : (
              <div className="grid gap-4">
                {savedResults.map((result) => (
                  <div
                    key={result.id}
                    className={`border rounded-lg p-4 transition-all cursor-pointer group relative ${
                      selectedResults.has(result.id)
                        ? 'border-green-400 bg-green-500/10'
                        : 'border-green-500/20 hover:bg-gray-700 hover:border-green-400'
                    } ${deletingResults.has(result.id) ? 'opacity-50' : ''}`}
                    onClick={() => viewSavedResult(result)}
                  >
                    <div className="flex items-start space-x-3">
                      {isSelectionMode && (
                        <div className="flex-shrink-0 mt-1">
                          {selectedResults.has(result.id) ? (
                            <CheckSquare className="h-5 w-5 text-green-400" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className={`font-medium mb-1 transition-colors ${
                          selectedResults.has(result.id) 
                            ? 'text-green-300' 
                            : 'text-white group-hover:text-green-400'
                        }`}>
                          {result.title}
                        </h3>
                        <p className="text-sm text-green-400 mb-2 truncate">{result.url}</p>
                        <p className="text-xs text-gray-400">{formatTimestamp(result.timestamp)}</p>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {!isSelectionMode && (
                          <button
                            onClick={(e) => deleteIndividualResult(result.id, e)}
                            disabled={deletingResults.has(result.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete this result"
                          >
                            {deletingResults.has(result.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <ExternalLink className={`h-4 w-4 mt-1 transition-colors ${
                          selectedResults.has(result.id)
                            ? 'text-green-400'
                            : 'text-gray-500 group-hover:text-green-400'
                        }`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scraped Results Display */}
        {currentResult && (
          <div className="bg-gray-800 rounded-xl shadow-lg border border-green-500/20 p-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center space-x-3 mb-6">
              <BookOpen className="h-5 w-5 text-green-400" />
              <h2 className="text-lg font-semibold text-white">Scraped Content</h2>
            </div>
            
            <div className="space-y-6">
              {/* Website Info */}
              <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-4 border border-green-500/20">
                <h3 className="font-medium text-white mb-2">{currentResult.title}</h3>
                <a
                  href={currentResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 text-sm inline-flex items-center group"
                >
                  {currentResult.url}
                  <ExternalLink className="h-3 w-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
                <p className="text-xs text-gray-400 mt-2">
                  Scraped on {formatTimestamp(currentResult.timestamp)}
                </p>
              </div>

              {/* Headings */}
              <div className="border border-green-500/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('headings')}
                  className="w-full flex items-center justify-between p-4 bg-green-500/10 hover:bg-green-500/20 transition-colors"
                >
                  <h3 className="font-medium text-white flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Headings ({currentResult.headings.length})
                  </h3>
                  {expandedSections.headings ? (
                    <ChevronUp className="h-5 w-5 text-green-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-green-400" />
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
                          className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-gray-300 hover:bg-green-500/20 transition-colors"
                        >
                          {heading}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-4">No headings found</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="border border-green-500/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('links')}
                  className="w-full flex items-center justify-between p-4 bg-green-500/10 hover:bg-green-500/20 transition-colors"
                >
                  <h3 className="font-medium text-white flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Links ({currentResult.links.length})
                  </h3>
                  {expandedSections.links ? (
                    <ChevronUp className="h-5 w-5 text-green-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-green-400" />
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
                          className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 hover:bg-green-500/20 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-300 hover:text-green-300 truncate flex-1 mr-3 font-medium hover:underline transition-colors group"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {link.text || link.url}
                            </a>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-green-400 font-mono truncate max-w-xs">{link.url}</span>
                              <ExternalLink className="h-3 w-3 text-green-400 flex-shrink-0" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-4">No links found</p>
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
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
              <img 
                src="/public/Cyber Scraper - Project Logo.jpeg" 
                alt="Cyber Scraper Logo" 
                className="w-16 h-16 object-cover rounded-full"
              />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Ready to scrape</h3>
            <p className="text-gray-300 mb-6">Enter a website URL above to extract its content</p>
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