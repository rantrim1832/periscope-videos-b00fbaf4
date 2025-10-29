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
    console.log('Taggbox webhook received');
    
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

    // Detect if video is positive based on caption/hashtags
    const positiveKeywords = ['great', 'love', 'amazing', 'perfect', 'beautiful', 'wonderful', 'excellent', 'positive', 'win', 'dream'];
    const isPositive = positiveKeywords.some(keyword => 
      videoCaption.toLowerCase().includes(keyword) || 
      hashtagArray.some(tag => tag.toLowerCase().includes(keyword))
    );

    // Mock city extraction from caption (regex-based)
    const cityMatch = videoCaption.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),?\s*([A-Z]{2})\b/);
    const detectedCity = cityMatch ? `${cityMatch[1]}, ${cityMatch[2]}` : 'General';

    // Determine if this is a short (based on hashtags or likes threshold)
    const isShort = hashtagArray.some(tag => 
      tag.toLowerCase().includes('shorts') || 
      tag.toLowerCase().includes('short')
    ) || (likes && likes >= 100);

    // Insert into appropriate table
    const tableName = isShort ? 'shorts' : 'seeded_videos';
    const insertData: any = {
      title: videoTitle,
      embed_url: embed_url || '',
      tags: hashtagArray,
      city: detectedCity,
      source: 'taggbox',
      moderation_status: 'pending',
      likes: likes || 0,
    };

    if (!isShort) {
      insertData.caption = videoCaption;
      insertData.hashtags = hashtagArray;
      insertData.is_positive = isPositive;
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    console.log(`${isShort ? 'Short' : 'Video'} imported successfully:`, data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${isShort ? 'Short' : 'Video'} imported successfully`,
        type: isShort ? 'short' : 'video',
        data 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in taggbox-webhook:', error);
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