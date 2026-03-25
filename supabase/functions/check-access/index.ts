import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, product_slug } = await req.json();

    if (!email || !product_slug) {
      return new Response(
        JSON.stringify({ error: "email and product_slug are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");

    if (!extUrl || !extKey) {
      console.error("Missing EXTERNAL_SUPABASE_URL or EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(extUrl, extKey);

    // Find profile by email (case-insensitive)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", email.trim().toLowerCase())
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.error("Profile query error:", profileError);
      return new Response(
        JSON.stringify({ has_access: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ has_access: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find product by slug
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("slug", product_slug)
      .eq("is_active", true)
      .maybeSingle();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ has_access: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check entitlement
    const now = new Date().toISOString();
    const { data: entitlement, error: entitlementError } = await supabase
      .from("entitlements")
      .select("id")
      .eq("user_id", profile.id)
      .eq("product_id", product.id)
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .maybeSingle();

    if (entitlementError) {
      console.error("Entitlement query error:", entitlementError);
      return new Response(
        JSON.stringify({ has_access: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ has_access: !!entitlement }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("check-access error:", e);
    return new Response(
      JSON.stringify({ has_access: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});