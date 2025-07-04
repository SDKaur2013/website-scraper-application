import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ScrapedData {
  title: string;
  headings: string[];
  links: { text: string; url: string }[];
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
    
    // Save to database
    const { data: savedResult, error: dbError } = await supabaseClient
      .from('scraped_results')
      .insert({
        user_id: user.id,
        url: targetUrl.toString(),
        title: scrapedData.title,
        headings: scrapedData.headings,
        links: scrapedData.links,
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
          headings: savedResult.headings,
          links: savedResult.links,
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

function parseHtml(html: string, baseUrl: string): ScrapedData {
  // Simple HTML parsing using regex (for basic extraction)
  // In production, you might want to use a proper HTML parser
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
  
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
    headings,
    links,
  };
}