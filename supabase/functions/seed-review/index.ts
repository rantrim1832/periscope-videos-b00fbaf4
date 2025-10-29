import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Seed review webhook received');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Extract data from Zapier/Taggbox payload
    const { 
      caption, 
      embed_url, 
      hashtags, 
      title,
      post_caption,
      likes 
    } = payload;

    // Use caption or post_caption as title fallback
    const videoTitle = title || caption || post_caption || 'Untitled Video';
    const videoCaption = post_caption || caption || '';
    
    // Parse hashtags (can be string or array)
    let hashtagArray: string[] = [];
    if (typeof hashtags === 'string') {
      hashtagArray = hashtags.split(/[\s,]+/).filter(tag => tag.startsWith('#'));
    } else if (Array.isArray(hashtags)) {
      hashtagArray = hashtags;
    }

    // Enhanced positive/negative detection
    const negativeKeywords = ['fail', 'roach', 'pest', 'nightmare', 'horrible', 'avoid', 'warning', 'disgusting', 'filthy', 'broken', 'mold', 'leak'];
    const positiveKeywords = ['great', 'love', 'amazing', 'perfect', 'beautiful', 'wonderful', 'excellent', 'positive', 'win', 'dream', 'clean', 'spacious', 'modern'];
    
    const contentLower = videoCaption.toLowerCase();
    const hashtagsLower = hashtagArray.join(' ').toLowerCase();
    
    const hasNegative = negativeKeywords.some(keyword => 
      contentLower.includes(keyword) || hashtagsLower.includes(keyword)
    );
    
    const hasPositive = positiveKeywords.some(keyword => 
      contentLower.includes(keyword) || hashtagsLower.includes(keyword)
    );
    
    // Default to neutral unless clear signals
    const isPositive = !hasNegative && hasPositive;
    
    // Auto-assign rating based on sentiment
    const rating = isPositive ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 2) + 1; // 4-5 for positive, 1-2 for negative

    // Mock city extraction from caption (regex-based for now)
    const cityMatch = videoCaption.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),?\s*([A-Z]{2})\b/);
    const detectedCity = cityMatch ? `${cityMatch[1]}, ${cityMatch[2]}` : 'General';

    // Determine if this is a short (based on hashtags or likes threshold)
    const isShort = hashtagArray.some(tag => 
      tag.toLowerCase().includes('shorts') || 
      tag.toLowerCase().includes('short')
    ) || (likes && likes >= 100);

    if (isShort) {
      // Insert into shorts table
      const { data, error } = await supabase
        .from('shorts')
        .insert({
          title: videoTitle,
          embed_url: embed_url || '',
          tags: hashtagArray,
          city: detectedCity,
          source: 'taggbox',
          moderation_status: 'pending',
          likes: likes || 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error (shorts):', error);
        throw error;
      }

      console.log('Short imported successfully:', data);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Short imported successfully',
          type: 'short',
          data 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else {
      // Insert into reviews table as seeded content
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          title: videoTitle,
          caption: videoCaption,
          embed_code: embed_url ? `<iframe src="${embed_url}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>` : '',
          video_url: embed_url || '',
          tags: hashtagArray,
          city: detectedCity,
          rating: rating,
          is_positive: isPositive,
          source: 'seeded',
          moderation_status: 'pending',
          likes: likes || 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error (reviews):', error);
        throw error;
      }

      console.log('Seeded review imported successfully:', data);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Seeded review imported successfully',
          type: 'review',
          sentiment: isPositive ? 'positive' : 'negative',
          rating: rating,
          data 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

  } catch (error) {
    console.error('Error in seed-review webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
