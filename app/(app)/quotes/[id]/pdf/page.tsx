import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  formatDate,
  calcLineTotal,
  calcEffectiveDiscount,
  VAT_RATE,
} from "@/lib/utils";
import { PdfPrintButton } from "@/components/quotes/pdf-print-button";
import Link from "next/link";

const UNIT_LABELS: Record<string, string> = { m2: "m²", fm: "fm", db: "db" };

export default async function QuotePdfPage({
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

  const items = ((quote.items ?? []) as Array<{
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
    with_anticondens: boolean;
    anticondens_price: number;
    product: {
      name: string;
      full_width: number | null;
      thickness: string | null;
      category: { name: string };
    } | null;
    variant: {
      color_code: string | null;
      palette: { name: string } | null;
    } | null;
  }>).sort((a, b) => a.sort_order - b.sort_order);

  const getLabel = (item: (typeof items)[0]) => {
    if (item.custom_description) return item.custom_description;
    const parts = [
      item.product?.name,
      item.product?.thickness,
      item.color_code ?? item.variant?.color_code ?? item.variant?.palette?.name,
    ].filter(Boolean) as string[];
    if (item.with_anticondens) parts.push("filccel");
    return parts.join(" · ");
  };

  // Flat rows — no grouping
  const rows = items.map((item) => {
    const anticondensAddon = item.with_anticondens ? (item.anticondens_price ?? 0) : 0;
    const effectivePrice = (item.unit_price_override ?? item.unit_price_base) + anticondensAddon;
    const effDiscount = calcEffectiveDiscount(item.discount_percent, quote.global_discount);
    const lineTotal = calcLineTotal(
      item.quantity,
      item.product?.full_width ?? null,
      effectivePrice,
      effDiscount,
      item.unit,
      item.piece_count,
    );
    const listTotal = calcLineTotal(
      item.quantity,
      item.product?.full_width ?? null,
      effectivePrice,
      0,
      item.unit,
      item.piece_count,
    );
    const isM2 = item.unit === "m2";
    const isFm = item.unit === "fm";
    const hasPieces = (isM2 || isFm) && item.piece_count != null;
    const fm = hasPieces ? item.piece_count! * item.quantity : null;
    const m2 = isM2 && fm != null && item.product?.full_width
      ? fm * item.product.full_width
      : null;

    let qtyLabel: string;
    if (hasPieces) {
      qtyLabel = `${item.piece_count} db × ${item.quantity.toFixed(2)} fm`;
      if (m2 != null) qtyLabel += ` = ${m2.toFixed(2)} m²`;
      else if (fm != null) qtyLabel += ` = ${fm.toFixed(2)} fm`;
    } else {
      qtyLabel = `${item.quantity} ${UNIT_LABELS[item.unit] ?? item.unit}`;
    }

    return { item, effectivePrice, effDiscount, lineTotal, listTotal, isM2, qtyLabel };
  });

  const netListTotal = rows.reduce((s, r) => s + r.listTotal, 0);
  const netTotal = rows.reduce((s, r) => s + r.lineTotal, 0);
  const totalDiscount = netListTotal - netTotal;
  const hasAnyDiscount = totalDiscount > 0.005;
  const vatAmount = quote.vat_type === "normál" ? netTotal * VAT_RATE : 0;
  const grossTotal = netTotal + vatAmount;

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      {/* Print controls – hidden on print */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/quotes/${id}`}
            className="text-primary-foreground/70 hover:text-primary-foreground text-sm"
          >
            ← Vissza
          </Link>
          <span className="text-sm font-medium">{quote.quote_number}</span>
        </div>
        <PdfPrintButton />
      </div>

      {/* PDF Content */}
      <div className="pt-16 print:pt-0 bg-white min-h-screen">
        <div
          className="max-w-[210mm] mx-auto p-12 print:p-10 print:max-w-none"
          id="pdf-content"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <div className="text-2xl font-bold text-[#2d3748]">
                SL Lemezkereskedés
              </div>
              <div className="text-sm text-gray-500 mt-1">
                <p>1234 Budapest, Példa utca 1.</p>
                <p>Tel: +36 30 123 4567</p>
                <p>Email: info@sl-lemezkereskedes.hu</p>
                <p>Adószám: 12345678-2-41</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#8b2020] mb-1">
                AJÁNLAT
              </div>
              <table className="text-sm text-right ml-auto">
                <tbody>
                  <tr>
                    <td className="text-gray-500 pr-3">Ajánlatszám:</td>
                    <td className="font-semibold">{quote.quote_number}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 pr-3">Kelt:</td>
                    <td>{formatDate(quote.created_at)}</td>
                  </tr>
                  {quote.valid_until && (
                    <tr>
                      <td className="text-gray-500 pr-3">Érvényes:</td>
                      <td>{formatDate(quote.valid_until)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Vevő adatai
            </div>
            <p className="font-semibold text-gray-800">{quote.customer_name}</p>
            {quote.customer_tax_number && (
              <p className="text-sm text-gray-600">
                Adószám: {quote.customer_tax_number}
              </p>
            )}
            {quote.customer_address && (
              <p className="text-sm text-gray-600">{quote.customer_address}</p>
            )}
            {quote.customer_phone && (
              <p className="text-sm text-gray-600">{quote.customer_phone}</p>
            )}
            {quote.customer_email && (
              <p className="text-sm text-gray-600">{quote.customer_email}</p>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full mb-6 text-sm">
            <thead>
              <tr className="border-b-2 border-[#2d3748]">
                <th className="text-left py-2 font-semibold text-[#2d3748] w-8">#</th>
                <th className="text-left py-2 font-semibold text-[#2d3748]">Megnevezés</th>
                <th className="text-right py-2 font-semibold text-[#2d3748] w-36">Mennyiség</th>
                <th className="text-right py-2 font-semibold text-[#2d3748] w-28">Egységár</th>
                <th className="text-right py-2 font-semibold text-[#2d3748] w-16">Kedv.</th>
                <th className="text-right py-2 font-semibold text-[#2d3748] w-28">Nettó</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ item, effectivePrice, effDiscount, lineTotal, isM2, qtyLabel }, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="py-2 pr-2 text-gray-400 align-top">{idx + 1}</td>
                  <td className="py-2 pr-4 text-gray-700">{getLabel(item)}</td>
                  <td className="py-2 text-right text-gray-700 whitespace-nowrap align-top">
                    {qtyLabel}
                  </td>
                  <td className="py-2 text-right text-gray-700 whitespace-nowrap align-top">
                    {effDiscount > 0 ? (
                      <>
                        <span className="line-through text-gray-400">
                          {formatCurrency(effectivePrice)}/{isM2 ? "m²" : UNIT_LABELS[item.unit] ?? item.unit}
                        </span>
                        <br />
                        <span>
                          {formatCurrency(effectivePrice * (1 - effDiscount / 100))}/{isM2 ? "m²" : UNIT_LABELS[item.unit] ?? item.unit}
                        </span>
                      </>
                    ) : (
                      <>{formatCurrency(effectivePrice)}/{isM2 ? "m²" : UNIT_LABELS[item.unit] ?? item.unit}</>
                    )}
                  </td>
                  <td className="py-2 text-right text-gray-500 align-top">
                    {effDiscount > 0 ? `${effDiscount.toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-2 text-right font-semibold text-gray-800 whitespace-nowrap align-top">
                    {formatCurrency(lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="min-w-[280px] space-y-1.5 text-sm">
              {hasAnyDiscount && (
                <>
                  <div className="flex justify-between pt-2 text-gray-400">
                    <span>Nettó összesen (listaáron):</span>
                    <span>{formatCurrency(netListTotal)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>Kedvezmény:</span>
                    <span>−{formatCurrency(totalDiscount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-500">Nettó fizetendő:</span>
                    <span className="font-semibold">{formatCurrency(netTotal)}</span>
                  </div>
                </>
              )}
              {!hasAnyDiscount && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-500">Nettó összesen:</span>
                  <span className="font-semibold">{formatCurrency(netTotal)}</span>
                </div>
              )}
              {quote.vat_type === "fordított" ? (
                <div className="flex justify-between text-amber-700">
                  <span>ÁFA (fordított adózás):</span>
                  <span>—</span>
                </div>
              ) : (
                <div className="flex justify-between text-gray-500">
                  <span>ÁFA (27%):</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1.5 text-base font-bold text-[#2d3748]">
                <span>Bruttó összesen:</span>
                <span>{formatCurrency(grossTotal)}</span>
              </div>
            </div>
          </div>

          {/* VAT note */}
          {quote.vat_type === "fordított" && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <strong>Fordított adózás:</strong> Az Áfa tv. 142. § (1) bekezdése
              alapján az ügyletet fordított adózás terheli. Az adót a vevő fizeti.
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div className="mb-8">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Megjegyzések
              </div>
              <p className="text-sm text-gray-600">{quote.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-gray-200 grid grid-cols-2 gap-8 text-sm text-gray-500">
            <div>
              <p className="font-semibold text-gray-700 mb-1">
                SL Lemezkereskedés Kft.
              </p>
              <p>Cégjegyzékszám: 01-09-123456</p>
              <p>Bankszámla: 12345678-12345678-12345678</p>
            </div>
            <div className="text-right">
              <p className="mb-8">Kelt: {formatDate(today)}</p>
              <div className="border-t border-gray-400 pt-1 inline-block min-w-[180px]">
                <p>SL Lemezkereskedés</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
