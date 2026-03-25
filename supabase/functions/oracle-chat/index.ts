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
You have access to THREE separate lottery database tables via the "query_lottery_db" tool:
- powerball_database (columns: id, "Draw Date", "Main Numbers", "Powerball")
- saturdaylotto_database (columns: id, "Draw Date", "Main Numbers", "Supps")
- ozlotto_database (columns: id, "Draw Date", "Year", "Main Numbers", "Supps")

Use it AUTOMATICALLY whenever:
- User asks about specific draw dates or results
- User asks for hot/cold numbers or frequency
- User asks about co-occurrence or patterns
- User asks 'has this number appeared recently?'
- User generates or validates a combination
- User asks for 'best numbers,' 'most drawn,' 'least drawn'

HOW TO USE THE DATA:
- The tool automatically picks the correct table based on lottery_name
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

// ── Table config per lottery ──
// Column names in the external Supabase have spaces and capitals
function getLotteryConfig(lottery_name: string) {
  switch (lottery_name) {
    case "Saturday Lotto":
      return { table: "saturdaylotto_database", mainCol: "Main Numbers", bonusCol: "Supps", dateCol: "Draw Date", yearCol: null };
    case "Oz Lotto":
      return { table: "ozlotto_database", mainCol: "Main Numbers", bonusCol: "Supps", dateCol: "Draw Date", yearCol: "Year" };
    default: // Powerball
      return { table: "powerball_database", mainCol: "Main Numbers", bonusCol: "Powerball", dateCol: "Draw Date", yearCol: null };
  }
}

// Parse space-separated text numbers → number[]
function parseNums(text: string | null): number[] {
  if (!text) return [];
  return text.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
}

// Month name mapping
const MONTH_MAP: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

// Parse text date from DB into { month, year } for filtering
// Formats: "21/03/2026" (powerball, saturdaylotto) or "17 March" + Year col "2026" (ozlotto)
function parseDateText(dateStr: string, yearStr?: string | null): { month: number; year: number } | null {
  if (!dateStr) return null;
  // Try dd/mm/yyyy
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) return { month: parseInt(slashMatch[2]), year: parseInt(slashMatch[3]) };
  // Try yyyy-mm-dd
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return { month: parseInt(isoMatch[2]), year: parseInt(isoMatch[1]) };
  // Try "17 March" + year column
  const textMatch = dateStr.match(/^\d+\s+(\w+)/);
  if (textMatch && yearStr) {
    const m = MONTH_MAP[textMatch[1].toLowerCase()];
    if (m) return { month: m, year: parseInt(yearStr) };
  }
  return null;
}

// ── Tool definition ──
const TOOLS = [
  {
    type: "function",
    function: {
      name: "query_lottery_db",
      description:
        "Query lottery draw history from the database. Each lottery has its own table. Returns parsed draw results with main numbers and bonus/powerball numbers. Use month+year params to filter by specific period.",
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
            description: "Number of draws to fetch (default 52, max 1000)",
          },
          numbers: {
            type: "array",
            items: { type: "number" },
            description: "Numbers to check (for check_combination)",
          },
          month: {
            type: "number",
            description: "Month number (1-12) to filter draws. Use with year.",
          },
          year: {
            type: "number",
            description: "Year (e.g. 2024, 2025, 2026) to filter draws. Use with month.",
          },
        },
        required: ["lottery_name", "query_type"],
      },
    },
  },
];

// Helper: fetch all rows from a table (bypasses 1000 limit)
async function fetchAllRows(supabase: any, table: string): Promise<any[]> {
  const rows: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

// Filter rows by month/year using text date parsing
function filterByPeriod(rows: any[], cfg: any, month?: number, year?: number): any[] {
  if (!month && !year) return rows;
  return rows.filter((row: any) => {
    const parsed = parseDateText(row[cfg.dateCol], cfg.yearCol ? row[cfg.yearCol] : null);
    if (!parsed) return false;
    if (month && parsed.month !== month) return false;
    if (year && parsed.year !== year) return false;
    return true;
  });
}

// ── Execute DB query ──
async function executeDbQuery(supabase: any, args: any): Promise<string> {
  const { lottery_name, query_type, limit = 52, numbers } = args;
  const cfg = getLotteryConfig(lottery_name);

  try {
    switch (query_type) {
      case "recent_draws": {
        const { data, error } = await supabase
          .from(cfg.table)
          .select("*")
          .order("id", { ascending: true })
          .limit(Math.min(limit, 100));
        if (error) return `Error: ${error.message}`;
        const parsed = (data || []).map((row: any) => ({
          id: row.id,
          draw_date: row[cfg.dateCol] + (cfg.yearCol && row[cfg.yearCol] ? ` ${row[cfg.yearCol]}` : ""),
          main_numbers: parseNums(row[cfg.mainCol]),
          bonus: parseNums(row[cfg.bonusCol]),
        }));
        return JSON.stringify({ lottery: lottery_name, count: parsed.length, draws: parsed });
      }

      case "frequency_analysis": {
        const { data, error } = await supabase
          .from(cfg.table)
          .select("*")
          .order("id", { ascending: true })
          .limit(Math.min(limit, 500));
        if (error) return `Error: ${error.message}`;

        const freq: Record<number, number> = {};
        const bonusFreq: Record<number, number> = {};
        for (const row of data || []) {
          for (const n of parseNums(row[cfg.mainCol])) freq[n] = (freq[n] || 0) + 1;
          for (const n of parseNums(row[cfg.bonusCol])) bonusFreq[n] = (bonusFreq[n] || 0) + 1;
        }
        const sorted = Object.entries(freq).map(([n, c]) => ({ number: +n, count: c })).sort((a, b) => b.count - a.count);
        const bonusSorted = Object.entries(bonusFreq).map(([n, c]) => ({ number: +n, count: c })).sort((a, b) => b.count - a.count);

        return JSON.stringify({
          lottery: lottery_name,
          draws_analysed: (data || []).length,
          top_main: sorted.slice(0, 20),
          top_bonus: bonusSorted.slice(0, 10),
          least_drawn: sorted.slice(-10).reverse(),
        });
      }

      case "top_numbers": {
        const { data, error } = await supabase
          .from(cfg.table)
          .select("*")
          .order("id", { ascending: true })
          .limit(Math.min(limit, 500));
        if (error) return `Error: ${error.message}`;

        const freq: Record<number, number> = {};
        for (const row of data || [])
          for (const n of parseNums(row[cfg.mainCol])) freq[n] = (freq[n] || 0) + 1;

        const pairs: Record<string, number> = {};
        for (const row of data || []) {
          const nums = parseNums(row[cfg.mainCol]).sort((a, b) => a - b);
          for (let i = 0; i < nums.length; i++)
            for (let j = i + 1; j < nums.length; j++) {
              const key = `${nums[i]}-${nums[j]}`;
              pairs[key] = (pairs[key] || 0) + 1;
            }
        }

        return JSON.stringify({
          lottery: lottery_name,
          draws_analysed: (data || []).length,
          top_20: Object.entries(freq).map(([n, c]) => ({ number: +n, count: c })).sort((a, b) => b.count - a.count).slice(0, 20),
          top_pairs: Object.entries(pairs).map(([k, c]) => ({ pair: k, count: c })).sort((a, b) => b.count - a.count).slice(0, 15),
        });
      }

      case "check_combination": {
        if (!numbers || numbers.length === 0) return "No numbers provided.";
        const { data, error } = await supabase
          .from(cfg.table)
          .select("*")
          .order("id", { ascending: true })
          .limit(Math.min(limit, 500));
        if (error) return `Error: ${error.message}`;

        const freq: Record<number, number> = {};
        for (const n of numbers) freq[n] = 0;
        let exactMatch = false;
        for (const row of data || []) {
          const mainNums = parseNums(row[cfg.mainCol]);
          for (const n of numbers) if (mainNums.includes(n)) freq[n]++;
          if (JSON.stringify([...mainNums].sort((a, b) => a - b)) === JSON.stringify([...numbers].sort((a, b) => a - b))) exactMatch = true;
        }

        return JSON.stringify({ lottery: lottery_name, draws_analysed: (data || []).length, number_frequencies: freq, exact_combination_found: exactMatch });
      }

      case "draws_by_date_range": {
        const { data, error } = await supabase
          .from(cfg.table)
          .select("*")
          .order("id", { ascending: true })
          .limit(100);
        if (error) return `Error: ${error.message}`;
        const parsed = (data || []).map((row: any) => ({
          id: row.id,
          draw_date: row[cfg.dateCol] + (cfg.yearCol && row[cfg.yearCol] ? ` ${row[cfg.yearCol]}` : ""),
          main_numbers: parseNums(row[cfg.mainCol]),
          bonus: parseNums(row[cfg.bonusCol]),
        }));
        return JSON.stringify({ lottery: lottery_name, draws: parsed });
      }

      default:
        return "Unknown query type";
    }
  } catch (e) {
    return `Database error: ${e instanceof Error ? e.message : "unknown"}`;
  }
}

// ── Main handler ──
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, page_context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL") || "https://vygtkmmkfrfrclfnljop.supabase.co";
    const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    if (!extKey) throw new Error("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY is not configured");
    const supabase = createClient(extUrl, extKey);

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
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await firstResponse.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const firstResult = await firstResponse.json();
    const choice = firstResult.choices?.[0];

    if (!choice?.message?.tool_calls || choice.message.tool_calls.length === 0) {
      const text = choice?.message?.content || "I'm here to help. What would you like to do?";
      const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`;
      return new Response(sseData, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    const toolCalls = choice.message.tool_calls;
    const toolResults: any[] = [];
    for (const tc of toolCalls) {
      const args = JSON.parse(tc.function.arguments);
      console.log("Tool call:", tc.function.name, JSON.stringify(args));
      const result = await executeDbQuery(supabase, args);
      console.log("Tool result preview:", result.substring(0, 300));
      toolResults.push({ role: "tool", tool_call_id: tc.id, content: result });
    }

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
          messages: [...apiMessages, choice.message, ...toolResults],
          stream: true,
        }),
      }
    );

    if (!secondResponse.ok) {
      const t = await secondResponse.text();
      console.error("AI second call error:", secondResponse.status, t);
      return new Response(JSON.stringify({ error: "AI processing error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(secondResponse.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("oracle-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
