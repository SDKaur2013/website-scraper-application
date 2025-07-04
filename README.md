# CyberScraper

Advanced website content extraction tool with intelligent scraping capabilities.

## Repository

This project is hosted on GitHub: [website-scraper-application/main](https://github.com/SDKaur2013/website-scraper-application/tree/main)

## Features

- **AI-Powered Analysis**: Intelligent content summarization and insights using OpenAI
- **Advanced Scraping**: Enhanced web scraping with Firecrawl integration
- **Smart Extraction**: Automatic extraction of headings, links, and key content
- **Sentiment Analysis**: AI-driven sentiment detection for scraped content
- **User Authentication**: Secure user accounts with Supabase Auth
- **Data Persistence**: Save and manage scraped results with full history
- **Responsive Design**: Beautiful, modern interface that works on all devices
- **Theme Support**: Light and dark mode with user preferences

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **AI Integration**: OpenAI GPT-3.5 Turbo
- **Web Scraping**: Firecrawl API with fallback scraping
- **Deployment**: Vite build system

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run development server: `npm run dev`

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `OPENAI_API_KEY`: OpenAI API key for AI analysis
- `FIRECRAWL_API_KEY`: Firecrawl API key for enhanced scraping