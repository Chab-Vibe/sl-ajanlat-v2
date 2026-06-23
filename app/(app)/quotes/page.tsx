import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, STATUS_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, Search } from "lucide-react";
import { QuoteFilters } from "@/components/quotes/quote-filters";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  let query = supabase
    .from("quotes")
    .select("*, creator:user_profiles(name)")
    .order("created_at", { ascending: false });

  if (!isAdmin) query = query.eq("created_by", user.id);
  if (params.status) query = query.eq("status", params.status as "draft" | "sent" | "accepted" | "declined");
  if (params.q) {
    query = query.or(
      `customer_name.ilike.%${params.q}%,quote_number.ilike.%${params.q}%`
    );
  }

  const { data: quotes } = await query;

  const statuses = ["draft", "sent", "accepted", "declined"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ajánlatok</h1>
        <Button asChild variant="accent">
          <Link href="/quotes/new">
            <Plus className="h-4 w-4" />
            Új ajánlat
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <QuoteFilters currentStatus={params.status} currentQ={params.q} statuses={statuses} />

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {!quotes || quotes.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nincs találat</p>
            </div>
          ) : (
            <div className="divide-y">
              {quotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{quote.quote_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {quote.customer_name}
                        {quote.customer_type === "cég" && (
                          <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">Cég</span>
                        )}
                      </p>
                      {isAdmin && quote.creator && (
                        <p className="text-xs text-muted-foreground">
                          {(quote.creator as { name: string }).name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {quote.vat_type === "fordított" && (
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Ford. ÁFA
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(quote.created_at)}
                    </span>
                    <Badge variant={quote.status as "draft" | "sent" | "accepted" | "declined"}>
                      {STATUS_LABELS[quote.status]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
