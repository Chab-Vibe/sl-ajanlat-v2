import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  formatDate,
  STATUS_LABELS,
  calcLineTotal,
  calcEffectiveDiscount,
  VAT_RATE,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QuoteStatusActions } from "@/components/quotes/quote-status-actions";
import {
  Edit,
  FileDown,
  ArrowLeft,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Receipt,
} from "lucide-react";

const UNIT_LABELS: Record<string, string> = { m2: "m²", fm: "fm", db: "db" };

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: quote } = await supabase
    .from("quotes")
    .select(`
      *,
      creator:user_profiles(name),
      items:quote_items(
        *,
        product:products(*, category:product_categories(*)),
        variant:product_variants(*, palette:color_palettes(*))
      )
    `)
    .eq("id", id)
    .single();

  if (!quote) notFound();

  const items = (quote.items ?? []) as Array<{
    id: string;
    piece_count: number | null;
    quantity: number;
    unit: string;
    unit_price_base: number;
    unit_price_override: number | null;
    discount_percent: number;
    custom_description: string | null;
    color_code: string | null;
    sort_order: number;
    product: {
      name: string;
      full_width: number | null;
      thickness: string | null;
      category: { name: string; unit: string };
    } | null;
    variant: {
      color_code: string | null;
      palette: { name: string } | null;
    } | null;
  }>;

  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);

  const netTotal = sortedItems.reduce((sum, item) => {
    const effectivePrice = item.unit_price_override ?? item.unit_price_base;
    const effDiscount = calcEffectiveDiscount(item.discount_percent, quote.global_discount);
    const line = calcLineTotal(
      item.quantity,
      item.product?.full_width ?? null,
      effectivePrice,
      effDiscount,
      item.unit,
      item.piece_count
    );
    return sum + line;
  }, 0);

  const vatAmount = quote.vat_type === "normál" ? netTotal * VAT_RATE : 0;
  const grossTotal = netTotal + vatAmount;

  const variantLabel = (v: { color_code: string | null; palette: { name: string } | null } | null) => {
    if (!v) return null;
    return v.color_code ?? v.palette?.name ?? null;
  };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const canEdit = profile?.role === "admin" || quote.created_by === user.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/quotes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{quote.quote_number}</h1>
              <Badge variant={quote.status as "draft" | "sent" | "accepted" | "declined"}>
                {STATUS_LABELS[quote.status]}
              </Badge>
              {quote.vat_type === "fordított" && (
                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Fordított ÁFA
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Létrehozva: {formatDate(quote.created_at)} ·{" "}
              {(quote.creator as { name: string } | null)?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/quotes/${id}/edit`}>
                <Edit className="h-4 w-4" />
                Szerkesztés
              </Link>
            </Button>
          )}
          <Button variant="accent" asChild>
            <Link href={`/quotes/${id}/pdf`} target="_blank">
              <FileDown className="h-4 w-4" />
              PDF
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer + Status */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {quote.customer_type === "cég" ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                Ügyfél
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold">{quote.customer_name}</p>
              {quote.customer_tax_number && (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Receipt className="h-3.5 w-3.5" />
                  {quote.customer_tax_number}
                </p>
              )}
              {quote.customer_address && (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {quote.customer_address}
                </p>
              )}
              {quote.customer_phone && (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {quote.customer_phone}
                </p>
              )}
              {quote.customer_email && (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {quote.customer_email}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Státusz</CardTitle>
            </CardHeader>
            <CardContent>
              <QuoteStatusActions quoteId={id} currentStatus={quote.status} canEdit={canEdit} />
            </CardContent>
          </Card>

          {quote.valid_until && (
            <Card>
              <CardContent className="p-4 text-sm">
                <p className="text-muted-foreground text-xs mb-0.5">Érvényes</p>
                <p className="font-medium">{formatDate(quote.valid_until)}</p>
              </CardContent>
            </Card>
          )}

          {quote.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Megjegyzések</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {quote.notes}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Items + Total */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tételek</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left pb-2 font-medium">#</th>
                    <th className="text-left pb-2 font-medium">Megnevezés</th>
                    <th className="text-right pb-2 font-medium">Menny.</th>
                    <th className="text-right pb-2 font-medium">Egységár</th>
                    <th className="text-right pb-2 font-medium">Kedv.</th>
                    <th className="text-right pb-2 font-medium">Nettó</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedItems.map((item, idx) => {
                    const effectivePrice = item.unit_price_override ?? item.unit_price_base;
                    const effDiscount = calcEffectiveDiscount(
                      item.discount_percent,
                      quote.global_discount
                    );
                    const lineTotal = calcLineTotal(
                      item.quantity,
                      item.product?.full_width ?? null,
                      effectivePrice,
                      effDiscount,
                      item.unit,
                      item.piece_count
                    );
                    const label = item.custom_description
                      ? item.custom_description
                      : [
                          item.product?.category?.name,
                          item.product?.name,
                          item.product?.thickness,
                          item.color_code ?? variantLabel(item.variant),
                        ]
                          .filter(Boolean)
                          .join(" · ");

                    const isM2Sheet = item.unit === "m2" && item.product?.full_width && item.piece_count != null;
                    const totalFm = isM2Sheet ? item.piece_count! * item.quantity : null;
                    const totalM2 = totalFm != null ? totalFm * item.product!.full_width! : null;

                    return (
                      <tr key={item.id} className="py-2">
                        <td className="py-2 pr-2 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2 pr-4">{label}</td>
                        <td className="py-2 text-right whitespace-nowrap">
                          {isM2Sheet ? (
                            <span>
                              {item.piece_count} db × {item.quantity} fm
                              <br />
                              <span className="text-muted-foreground text-xs">= {totalM2?.toFixed(2)} m²</span>
                            </span>
                          ) : (
                            <>{item.quantity} {UNIT_LABELS[item.unit] ?? item.unit}</>
                          )}
                        </td>
                        <td className="py-2 text-right whitespace-nowrap">
                          {formatCurrency(effectivePrice)}
                        </td>
                        <td className="py-2 text-right whitespace-nowrap text-muted-foreground">
                          {effDiscount > 0 ? `${effDiscount.toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2 text-right font-medium whitespace-nowrap">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <Separator className="mt-4 mb-3" />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nettó összesen:</span>
                  <span className="font-semibold">{formatCurrency(netTotal)}</span>
                </div>
                {quote.vat_type === "fordított" ? (
                  <div className="flex justify-between text-amber-700">
                    <span>ÁFA (fordított — §142):</span>
                    <span>—</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-muted-foreground">
                    <span>ÁFA (27%):</span>
                    <span>{formatCurrency(vatAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Bruttó összesen:</span>
                  <span>{formatCurrency(grossTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
