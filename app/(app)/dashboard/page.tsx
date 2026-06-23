import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, TrendingUp, Clock, CheckCircle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // Load quotes (admin sees all, user sees own)
  const quotesQuery = supabase
    .from("quotes")
    .select("*, creator:user_profiles(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  if (!isAdmin) {
    quotesQuery.eq("created_by", user.id);
  }

  const { data: quotes } = await quotesQuery;

  // Stats
  const allQuery = isAdmin
    ? supabase.from("quotes").select("status, global_discount")
    : supabase.from("quotes").select("status, global_discount").eq("created_by", user.id);

  const { data: allQuotes } = await allQuery;

  const stats = {
    total: allQuotes?.length ?? 0,
    draft: allQuotes?.filter((q) => q.status === "draft").length ?? 0,
    sent: allQuotes?.filter((q) => q.status === "sent").length ?? 0,
    accepted: allQuotes?.filter((q) => q.status === "accepted").length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Üdvözöljük, {profile?.name}!
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/quotes/new">
            <Plus className="h-4 w-4" />
            Új ajánlat
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Összes ajánlat</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.draft}</p>
                <p className="text-xs text-muted-foreground">Piszkozat</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sent}</p>
                <p className="text-xs text-muted-foreground">Elküldve</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.accepted}</p>
                <p className="text-xs text-muted-foreground">Elfogadva</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Legutóbbi ajánlatok</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/quotes">Összes →</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!quotes || quotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Még nincs ajánlat</p>
              <Button asChild variant="accent" size="sm" className="mt-3">
                <Link href="/quotes/new">
                  <Plus className="h-4 w-4" />
                  Első ajánlat létrehozása
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {quotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{quote.quote_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {quote.customer_name}
                        {isAdmin && quote.creator && (
                          <> · {(quote.creator as { name: string }).name}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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
