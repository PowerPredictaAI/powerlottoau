import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are 'Oracle AI,' Power Lotto AI's premium copilot inside the platform.

MISSION
Help the user:
1) Understand what to do on each screen.
2) Make better decisions when choosing combinations and filters.
3) Use the platform faster (fewer clicks, fewer doubts).
4) Feel like they are 'playing with a method,' not randomly.

========================
DATABASE INTEGRATION (MANDATORY)
========================
You have access to the powerball_database table via a tool called "query_lottery_db".
Use it AUTOMATICALLY whenever:
- User asks about specific draw dates or results
- User asks for hot/cold numbers or frequency
- User asks about co-occurrence or patterns
- User asks 'has this number appeared recently?'
- User generates or validates a combination
- User asks for 'best numbers,' 'most drawn,' 'least drawn'

Available lottery_name values: 'Powerball', 'Saturday Lotto', 'Oz Lotto'

HOW TO USE THE DATA:
- Always filter by lottery_name
- Present data as insights, not predictions: 'Based on the last 52 draws, number X appeared Y times'
- If the query returns no data: say 'I couldn't find data for that period — want me to try a wider range?'
- Never fabricate numbers. If DB is unavailable: 'I can't retrieve live data right now. Try the Database screen for manual lookup.'
- Never present historical data as prediction. Always clarify it's frequency-based analysis.

========================
CONVERSATIONAL MODE
========================
Always respond in short, guided turns. Do NOT dump all the information at once.

RESPONSE RULES
1) Maximum 4 lines per message (unless the user asks 'explain everything').
2) Maximum 1 question at a time.
3) Deliver information in 'layers':
   - Layer 1: confirm intent + key question
   - Layer 2: give the next step
   - Layer 3: only if they confirm/insist, give details
4) Avoid long lists. If you need to list, maximum 3 bullets.
5) Do not repeat full legal texts. Just mention 'according to the legal notices' in 1 short sentence.

STYLE
- Natural, human Australian English.
- Short sentences. No long speeches.
- Use 'Let's take it step by step.'
- Zero magical promises ('guaranteed,' 'sure win' are forbidden).
- Emphasize method, discipline, probability, and risk management.
- Use a premium tone: safety, precision, calm.

'MORE DETAILS' TRIGGER
Only give long explanations if the user writes:
- 'explain everything'
- 'give me all the steps'
- 'go into detail'

GOLDEN RULES (NEVER BREAK)
1) Do NOT make up user data or lottery numbers. Always use query_lottery_db when data is needed.
2) Do NOT promise prizes or winning percentages.
3) When there is uncertainty, say 'I can't confirm that' and offer how to verify it inside the platform.
4) If the user asks for 'winning numbers,' redirect: 'that doesn't exist' → offer strategy/criteria instead.
5) If the user is lost, switch to 'Guide Mode' with simple steps.
6) Never present historical data as prediction.

FIRST INTERACTION (ALWAYS)
If the conversation has no prior user messages, ask:
'G'day! What would you like to do?
A) Generate combinations
B) Analyse patterns/history
C) Optimise a combination you already have'

========================
PAGE CONTEXT
========================
You may receive page_context with the current route. Use it to:
- Mention the screen by name
- Suggest relevant actions
- If the user seems lost, activate Guide Mode for their current page

========================
HELP MODES
========================
- Guide Mode: user is lost or asks for 'step by step'
- Optimisation Mode: user has numbers and wants to improve them
- Explanation Mode: user asks 'what does this mean'
- Decision Mode: user is unsure between 2 options
- Analysis Mode: user wants hot/cold numbers, patterns → always use query_lottery_db

========================
LOTTERIES SUPPORTED
========================
1) POWERBALL (Australia)
   - Main numbers: pick 7 from 1–35
   - Powerball: pick 1 from 1–20
   - Draws: Thursdays

2) SATURDAY LOTTO (Australia)
   - Main numbers: pick 6 from 1–45
   - Supplementary numbers: 2 drawn (not chosen by player)
   - Draws: Saturdays

3) OZ LOTTO (Australia)
   - Main numbers: pick 7 from 1–47
   - Supplementary numbers: 2 drawn (not chosen by player)
   - Draws: Tuesdays

========================
INCREASE PERCEIVED VALUE
========================
1) 'Healthy Combination' CHECKLIST (when generating)
   - Diversity (high/low)?
   - Balanced odd/even?
   - Avoids obvious patterns?
   - Cross-check: has this exact combination appeared before? (use query_lottery_db)

2) PRESETS
   - Conservative: balanced odd/even and high/low
   - Balanced: moderate mix
   - Aggressive: more variation

3) '3-MINUTE PLAN' for users in a hurry

4) QUICK COMPARISON for decisions (pros/cons in 4 lines)

========================
POLICIES ON COMBINATIONS
========================
- Suggest combinations ONLY if explicitly asked
- Always provide several options (5–10), explain criteria (2 lines)
- Cross-reference with DB to flag repeated combinations
- Add responsibility reminder ('there are no guarantees')
- Never say 'this is the best one'

========================
MANDATORY CLOSING
========================
Always end with a short question that moves the conversation forward.

========================
PLATFORM MAP
========================
1) START (/select-lottery): Choose lottery, then draw date
2) GENERATE (/results): 3 regular + 3 bonus games with scores
   2b) VALIDATE (/validate-game): User picks numbers for AI analysis
   2c) RESULTS (/validate-results): AI probability analysis
3) DATABASE (/database): Draw history, filter by year/lottery
4) EBOOK: Smart Player's Handbook

========================
SUPPORT & REFUNDS
========================
- First: 1 question to understand the problem
- Escalate to human only if: user asks OR billing/refund issue
- For refunds: 3-message flow ending with powerai.help@gmail.com
- Ask for: email, last 4 card digits, purchase date`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "query_lottery_db",
      description:
        "Query the powerball_database table. Use for frequency analysis, recent draws, pattern checks, or looking up specific draws. Returns up to 100 rows.",
      parameters: {
        type: "object",
        properties: {
          lottery_name: {
            type: "string",
            enum: ["Powerball", "Saturday Lotto", "Oz Lotto"],
            description: "Which lottery to query",
          },
          query_type: {
            type: "string",
            enum: [
              "recent_draws",
              "frequency_analysis",
              "check_combination",
              "draws_by_date_range",
              "top_numbers",
            ],
            description: "Type of query to run",
          },
          limit: {
            type: "number",
            description: "Number of draws to look back (default 52)",
          },
          date_from: {
            type: "string",
            description: "Start date filter YYYY-MM-DD",
          },
          date_to: {
            type: "string",
            description: "End date filter YYYY-MM-DD",
          },
          numbers: {
            type: "array",
            items: { type: "number" },
            description:
              "Numbers to check (for check_combination or frequency)",
          },
        },
        required: ["lottery_name", "query_type"],
      },
    },
  },
];

async function executeDbQuery(
  supabase: any,
  args: any
): Promise<string> {
  const {
    lottery_name,
    query_type,
    limit = 52,
    date_from,
    date_to,
    numbers,
  } = args;

  try {
    switch (query_type) {
      case "recent_draws": {
        let q = supabase
          .from("powerball_database")
          .select("draw_number, draw_date, main_numbers, bonus_numbers, total_winners")
          .eq("lottery_name", lottery_name)
          .order("draw_date", { ascending: false })
          .limit(Math.min(limit, 100));
        if (date_from) q = q.gte("draw_date", date_from);
        if (date_to) q = q.lte("draw_date", date_to);
        const { data, error } = await q;
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data);
      }

      case "frequency_analysis": {
        let q = supabase
          .from("lottery_draws")
          .select("main_numbers, bonus_numbers")
          .eq("lottery_name", lottery_name)
          .order("draw_date", { ascending: false })
          .limit(Math.min(limit, 200));
        if (date_from) q = q.gte("draw_date", date_from);
        if (date_to) q = q.lte("draw_date", date_to);
        const { data, error } = await q;
        if (error) return `Error: ${error.message}`;

        const freq: Record<number, number> = {};
        const bonusFreq: Record<number, number> = {};
        for (const row of data || []) {
          for (const n of row.main_numbers) freq[n] = (freq[n] || 0) + 1;
          for (const n of row.bonus_numbers) bonusFreq[n] = (bonusFreq[n] || 0) + 1;
        }
        const sorted = Object.entries(freq)
          .map(([n, c]) => ({ number: +n, count: c }))
          .sort((a, b) => b.count - a.count);
        const bonusSorted = Object.entries(bonusFreq)
          .map(([n, c]) => ({ number: +n, count: c }))
          .sort((a, b) => b.count - a.count);

        return JSON.stringify({
          draws_analysed: (data || []).length,
          top_main_numbers: sorted.slice(0, 20),
          top_bonus_numbers: bonusSorted.slice(0, 10),
          least_drawn: sorted.slice(-10).reverse(),
        });
      }

      case "top_numbers": {
        let q = supabase
          .from("powerball_database")
          .select("main_numbers, bonus_numbers")
          .eq("lottery_name", lottery_name)
          .order("draw_date", { ascending: false })
          .limit(Math.min(limit, 200));
        if (date_from) q = q.gte("draw_date", date_from);
        if (date_to) q = q.lte("draw_date", date_to);
        const { data, error } = await q;
        if (error) return `Error: ${error.message}`;

        const freq: Record<number, number> = {};
        for (const row of data || [])
          for (const n of row.main_numbers) freq[n] = (freq[n] || 0) + 1;

        const pairs: Record<string, number> = {};
        for (const row of data || []) {
          const nums = row.main_numbers.sort((a: number, b: number) => a - b);
          for (let i = 0; i < nums.length; i++)
            for (let j = i + 1; j < nums.length; j++) {
              const key = `${nums[i]}-${nums[j]}`;
              pairs[key] = (pairs[key] || 0) + 1;
            }
        }
        const topPairs = Object.entries(pairs)
          .map(([k, c]) => ({ pair: k, count: c }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15);

        return JSON.stringify({
          draws_analysed: (data || []).length,
          top_20: Object.entries(freq)
            .map(([n, c]) => ({ number: +n, count: c }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20),
          top_pairs: topPairs,
        });
      }

      case "check_combination": {
        if (!numbers || numbers.length === 0)
          return "No numbers provided to check.";
        let q = supabase
          .from("powerball_database")
          .select("draw_number, draw_date, main_numbers, bonus_numbers")
          .eq("lottery_name", lottery_name)
          .order("draw_date", { ascending: false })
          .limit(Math.min(limit, 200));
        if (date_from) q = q.gte("draw_date", date_from);
        if (date_to) q = q.lte("draw_date", date_to);
        const { data, error } = await q;
        if (error) return `Error: ${error.message}`;

        // Check frequency of each requested number
        const freq: Record<number, number> = {};
        for (const n of numbers) freq[n] = 0;
        let exactMatch = false;

        for (const row of data || []) {
          for (const n of numbers) {
            if (row.main_numbers.includes(n)) freq[n]++;
          }
          const sorted1 = [...row.main_numbers].sort((a: number, b: number) => a - b);
          const sorted2 = [...numbers].sort((a, b) => a - b);
          if (JSON.stringify(sorted1) === JSON.stringify(sorted2)) exactMatch = true;
        }

        return JSON.stringify({
          draws_analysed: (data || []).length,
          number_frequencies: freq,
          exact_combination_found: exactMatch,
        });
      }

      case "draws_by_date_range": {
        let q = supabase
          .from("lottery_draws")
          .select("draw_number, draw_date, main_numbers, bonus_numbers, total_winners")
          .eq("lottery_name", lottery_name)
          .order("draw_date", { ascending: false })
          .limit(100);
        if (date_from) q = q.gte("draw_date", date_from);
        if (date_to) q = q.lte("draw_date", date_to);
        const { data, error } = await q;
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data);
      }

      default:
        return "Unknown query type";
    }
  } catch (e) {
    return `Database error: ${e instanceof Error ? e.message : "unknown"}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, page_context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Build system message with page context
    let systemContent = SYSTEM_PROMPT;
    if (page_context) {
      systemContent += `\n\nCURRENT PAGE CONTEXT:\n- Route: ${page_context.route || "unknown"}\n- Page: ${page_context.pageTitle || "unknown"}`;
      if (page_context.selectedLottery)
        systemContent += `\n- Selected lottery: ${page_context.selectedLottery}`;
    }

    const apiMessages = [
      { role: "system", content: systemContent },
      ...messages,
    ];

    // First call with tools
    const firstResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: apiMessages,
          tools: TOOLS,
          tool_choice: "auto",
        }),
      }
    );

    if (!firstResponse.ok) {
      const status = firstResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await firstResponse.text();
      console.error("AI gateway error:", status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstResult = await firstResponse.json();
    const choice = firstResult.choices?.[0];

    // If no tool calls, return the text directly as streaming-compatible SSE
    if (!choice?.message?.tool_calls || choice.message.tool_calls.length === 0) {
      const text = choice?.message?.content || "I'm here to help. What would you like to do?";
      const sseData = `data: ${JSON.stringify({
        choices: [{ delta: { content: text } }],
      })}\n\ndata: [DONE]\n\n`;
      return new Response(sseData, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Execute tool calls
    const toolCalls = choice.message.tool_calls;
    const toolResults: any[] = [];

    for (const tc of toolCalls) {
      const args = JSON.parse(tc.function.arguments);
      const result = await executeDbQuery(supabase, args);
      toolResults.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result,
      });
    }

    // Second call with tool results, now streaming
    const secondResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            ...apiMessages,
            choice.message,
            ...toolResults,
          ],
          stream: true,
        }),
      }
    );

    if (!secondResponse.ok) {
      const t = await secondResponse.text();
      console.error("AI second call error:", secondResponse.status, t);
      return new Response(
        JSON.stringify({ error: "AI processing error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(secondResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("oracle-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
