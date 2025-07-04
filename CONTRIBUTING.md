# Contributing to CyberScraper

Thank you for your interest in contributing to CyberScraper! This document provides guidelines for contributing to the project.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/[username]/cyber-scraper.git
   cd cyber-scraper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
cyber-scraper/
├── src/
│   ├── components/          # React components
│   ├── contexts/           # React contexts
│   ├── lib/               # Utility libraries
│   └── App.tsx            # Main application component
├── supabase/
│   ├── functions/         # Edge functions
│   └── migrations/        # Database migrations
├── public/               # Static assets
└── package.json         # Project configuration
```

## Key Features

- **AI-Powered Analysis**: Uses OpenAI for content summarization and insights
- **Enhanced Scraping**: Firecrawl integration with fallback scraping
- **User Authentication**: Supabase Auth integration
- **Real-time Database**: Supabase for data persistence
- **Responsive Design**: Modern UI with dark/light theme support

## Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Write descriptive commit messages

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## API Keys Required

- **Supabase**: For database and authentication
- **OpenAI**: For AI analysis features
- **Firecrawl**: For enhanced web scraping

## License

This project is open source. Please ensure your contributions align with the project's goals and coding standards.