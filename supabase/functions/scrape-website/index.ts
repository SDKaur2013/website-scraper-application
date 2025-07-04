import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ScrapedData {
  title: string;
  content: string;
  headings: string[];
  links: { text: string; url: string }[];
  aiSummary?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse request body
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    // Fetch the webpage
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebScraper/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse HTML and extract data
    const scrapedData = parseHtml(html, targetUrl.toString());
    
    // Generate AI summary if OpenAI API key is available and content exists
    let aiSummary = '';
    let analysisStatus = 'pending';
    
    if (Deno.env.get('OPENAI_API_KEY') && scrapedData.content.trim()) {
      try {
        console.log('Generating AI summary for content length:', scrapedData.content.length);
        aiSummary = await generateAISummary(scrapedData.content, scrapedData.title);
        analysisStatus = 'completed';
        console.log('AI summary generated successfully');
      } catch (error) {
        console.error('AI summary generation failed:', error.message);
        analysisStatus = 'failed';
        // Continue without summary if AI fails
      }
    } else {
      console.log('OpenAI API key available:', !!Deno.env.get('OPENAI_API_KEY'));
      console.log('Content available:', !!scrapedData.content.trim());
    }
    
    // Save to database
    const { data: savedResult, error: dbError } = await supabaseClient
      .from('scraped_results')
      .insert({
        user_id: user.id,
        url: targetUrl.toString(),
        title: scrapedData.title,
        content: scrapedData.content,
        headings: scrapedData.headings,
        links: scrapedData.links,
        ai_summary: aiSummary || null,
        analysis_status: analysisStatus,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: savedResult.id,
          url: savedResult.url,
          title: savedResult.title,
          content: savedResult.content,
          headings: savedResult.headings,
          links: savedResult.links,
          aiSummary: savedResult.ai_summary,
          analysisStatus: savedResult.analysis_status,
          timestamp: savedResult.created_at,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Scraping error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateAISummary(content: string, title: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Using OpenAI API key (first 10 chars):', openaiApiKey.substring(0, 10) + '...');

  // Truncate content if too long (OpenAI has token limits)
  const maxContentLength = 12000; // Roughly 3000 tokens
  const truncatedContent = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + '...'
    : content;

  console.log('Sending content to OpenAI, length:', truncatedContent.length);
  const prompt = `Please provide a comprehensive yet concise summary of the following webpage content. Focus on the key points, main topics, and important takeaways. Make it informative and well-structured. Limit to 250 words maximum.

Title: ${title}

Content: ${truncatedContent}

Please provide a summary that captures the essence and main points of this content:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API response:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('OpenAI response received, choices:', data.choices?.length);
  return data.choices[0]?.message?.content?.trim() || 'Summary could not be generated.';
}

function parseHtml(html: string, baseUrl: string): ScrapedData {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
  
  // Extract main content text
  let content = html;
  
  // Remove script and style tags
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  content = content.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
  
  // Remove HTML tags and get text content
  content = content.replace(/<[^>]+>/g, ' ');
  
  // Clean up whitespace
  content = content.replace(/\s+/g, ' ').trim();
  
  // Remove common navigation and footer text patterns
  content = content.replace(/\b(home|about|contact|privacy|terms|cookies?|login|register|sign up|sign in|menu|navigation|footer|header)\b/gi, '');
  
  // Limit content length for processing
  if (content.length > 15000) {
    content = content.substring(0, 15000);
  }
  
  // Extract headings (h1-h6)
  const headingMatches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];
  const headings = headingMatches
    .map(match => {
      const textMatch = match.match(/>([^<]+)</);
      return textMatch ? textMatch[1].trim() : '';
    })
    .filter(heading => heading.length > 0)
    .slice(0, 20); // Limit to first 20 headings
  
  // Extract links
  const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi) || [];
  const links = linkMatches
    .map(match => {
      const hrefMatch = match.match(/href=["']([^"']+)["']/i);
      const textMatch = match.match(/>([^<]*)</);
      
      if (!hrefMatch) return null;
      
      let href = hrefMatch[1];
      const text = textMatch ? textMatch[1].trim() : href;
      
      // Convert relative URLs to absolute
      if (href.startsWith('/')) {
        const base = new URL(baseUrl);
        href = `${base.protocol}//${base.host}${href}`;
      } else if (href.startsWith('./') || !href.includes('://')) {
        try {
          href = new URL(href, baseUrl).toString();
        } catch {
          // Skip invalid URLs
          return null;
        }
      }
      
      return { text: text || href, url: href };
    })
    .filter((link): link is { text: string; url: string } => 
      link !== null && 
      link.text.length > 0 && 
      link.url.length > 0 &&
      !link.url.startsWith('javascript:') &&
      !link.url.startsWith('mailto:')
    )
    .slice(0, 50); // Limit to first 50 links
  
  return {
    title,
    content,
    headings,
    links,
  };
}