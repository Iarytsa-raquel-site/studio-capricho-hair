export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
