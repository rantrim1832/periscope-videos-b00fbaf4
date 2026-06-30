import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireAuth, authErrorResponse } from "../_shared/auth.ts";

interface ModerationResult {
  approved: boolean;
  score: number;
  flags: string[];
  reason?: string;
}

async function moderateContent(text: string): Promise<ModerationResult> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    // Fail closed: do not vouch for content we could not screen.
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
            content: `You are a content moderation AI for an apartment review platform. Analyze the content and return a JSON response with:
- toxicity_score: 0-1 (0=safe, 1=toxic)
- flags: array of issues found (e.g., "profanity", "hate_speech", "threats", "sexual_content", "spam")
- approved: boolean (false if toxicity_score > 0.7 OR any severe violations)
- reason: brief explanation if rejected

Be strict but fair. Flag:
- Hate speech, slurs, bigotry
- Graphic violence or threats
- Explicit sexual content
- Spam or scams
- Severe profanity

Allow:
- Negative reviews about apartments (pests, maintenance issues)
- Mild frustration or complaints
- Casual language

Return ONLY valid JSON, no markdown.`
          },
          {
            role: 'user',
            content: `Analyze this content:\n\n${text}`
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
                  toxicity_score: { 
                    type: "number",
                    minimum: 0,
                    maximum: 1
                  },
                  flags: {
                    type: "array",
                    items: { type: "string" }
                  },
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
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return { approved: false, score: 1, flags: ['moderation_error'], reason: 'Moderation service error' };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error('No tool call in response');
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await requireAuth(req);
  } catch (err) {
    return authErrorResponse(err);
  }

  try {
    const { text } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Moderating content:', text.substring(0, 100));
    const result = await moderateContent(text);
    console.log('Moderation result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in moderate-content:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        approved: false, // Fail closed
        score: 1,
        flags: ['moderation_exception']
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
