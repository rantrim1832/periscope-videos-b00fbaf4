import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";
import { corsHeaders, requireWebhookSecret, authErrorResponse } from "../_shared/auth.ts";

interface ModerationResult {
  approved: boolean;
  score: number;
  flags: string[];
  reason?: string;
}

async function moderateContent(text: string): Promise<ModerationResult> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    // Fail closed: without moderation we cannot vouch for safety, so
    // hold the content for human review rather than auto-approving.
    console.error('LOVABLE_API_KEY not found — failing closed');
    return { approved: false, score: 1, flags: ['moderation_unavailable'], reason: 'Moderation unavailable' };
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a content moderation AI for an apartment review platform. Analyze the content and return moderation assessment.`
          },
          {
            role: 'user',
            content: `Analyze this content for toxicity, hate speech, threats, explicit content:\n\n${text}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "moderate_content",
              description: "Return content moderation analysis",
              parameters: {
                type: "object",
                properties: {
                  toxicity_score: { type: "number", minimum: 0, maximum: 1 },
                  flags: { type: "array", items: { type: "string" } },
                  approved: { type: "boolean" },
                  reason: { type: "string" }
                },
                required: ["toxicity_score", "flags", "approved"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "moderate_content" } }
      }),
    });

    if (!response.ok) {
      console.error('AI moderation error:', response.status);
      return { approved: false, score: 1, flags: ['moderation_error'], reason: 'Moderation service error' };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      return { approved: false, score: 1, flags: ['moderation_error'], reason: 'Moderation returned no result' };
    }

    const result = JSON.parse(toolCall.function.arguments);
    return {
      approved: result.approved,
      score: result.toxicity_score,
      flags: result.flags || [],
      reason: result.reason
    };

  } catch (error) {
    console.error('Moderation error:', error);
    return { approved: false, score: 1, flags: ['moderation_exception'], reason: 'Moderation threw an exception' };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    requireWebhookSecret(req);
  } catch (err) {
    return authErrorResponse(err);
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

    // AI Content Moderation
    console.log('Running AI moderation...');
    const contentToModerate = `${videoTitle}\n${videoCaption}\n${hashtagArray.join(' ')}`;
    const moderation = await moderateContent(contentToModerate);
    console.log('Moderation result:', moderation);

    // Determine moderation status with fail-closed semantics:
    // - genuinely toxic content -> 'rejected'
    // - moderation unavailable/errored -> 'pending' (human review queue)
    // - clean -> 'approved'
    const moderationUnavailable = moderation.flags.some((f) =>
      ['moderation_unavailable', 'moderation_error', 'moderation_exception'].includes(f)
    );
    const isToxic = !moderation.approved || moderation.score > 0.7;
    const moderationStatus = moderationUnavailable
      ? 'pending'
      : isToxic
        ? 'rejected'
        : 'approved';
    const shouldReject = moderationStatus !== 'approved';

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
          moderation_status: moderationStatus,
          moderation_score: moderation.score,
          ai_flags: moderation.flags,
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
          message: shouldReject ? 'Short rejected by AI moderation' : 'Short imported successfully',
          type: 'short',
          moderation: {
            approved: !shouldReject,
            score: moderation.score,
            flags: moderation.flags,
            reason: moderation.reason
          },
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
          moderation_status: moderationStatus,
          moderation_score: moderation.score,
          ai_flags: moderation.flags,
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
          message: shouldReject ? 'Review rejected by AI moderation' : 'Seeded review imported successfully',
          type: 'review',
          sentiment: isPositive ? 'positive' : 'negative',
          rating: rating,
          moderation: {
            approved: !shouldReject,
            score: moderation.score,
            flags: moderation.flags,
            reason: moderation.reason
          },
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
