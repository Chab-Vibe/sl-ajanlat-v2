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
    return [
      item.product?.category?.name,
      item.product?.name,
      item.product?.thickness,
      item.color_code ?? item.variant?.color_code ?? item.variant?.palette?.name,
    ]
      .filter(Boolean)
      .join(" · ");
  };

  // Group consecutive items with same product+variant+color into display groups
  type QtyRow = { piece_count: number | null; quantity: number };
  type Group = {
    label: string;
    unit: string;
    full_width: number | null;
    unit_price: number;
    eff_discount: number;
    rows: QtyRow[];
    group_total: number;
  };

  const groups: Group[] = [];
  for (const item of items) {
    const effectivePrice = item.unit_price_override ?? item.unit_price_base;
    const effDiscount = calcEffectiveDiscount(item.discount_percent, quote.global_discount);
    const rowTotal = calcLineTotal(item.quantity, item.product?.full_width ?? null, effectivePrice, effDiscount, item.unit, item.piece_count);
    const last = groups[groups.length - 1];
    const sameGroup =
      last &&
      last.label === getLabel(item) &&
      last.unit === item.unit &&
      last.unit_price === effectivePrice;
    if (sameGroup) {
      last.rows.push({ piece_count: item.piece_count, quantity: item.quantity });
      last.group_total += rowTotal;
    } else {
      groups.push({
        label: getLabel(item),
        unit: item.unit,
        full_width: item.product?.full_width ?? null,
        unit_price: effectivePrice,
        eff_discount: effDiscount,
        rows: [{ piece_count: item.piece_count, quantity: item.quantity }],
        group_total: rowTotal,
      });
    }
  }

  const netTotal = groups.reduce((s, g) => s + g.group_total, 0);
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
                <th className="text-left py-2 font-semibold text-[#2d3748] w-8">
                  #
                </th>
                <th className="text-left py-2 font-semibold text-[#2d3748]">
                  Megnevezés
                </th>
                <th className="text-right py-2 font-semibold text-[#2d3748] w-24">
                  Menny.
                </th>
                <th className="text-right py-2 font-semibold text-[#2d3748] w-28">
                  Egységár
                </th>
                <th className="text-right py-2 font-semibold text-[#2d3748] w-16">
                  Kedv.
                </th>
                <th className="text-right py-2 font-semibold text-[#2d3748] w-28">
                  Nettó
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group, gIdx) => {
                const isM2 = group.unit === "m2" && group.full_width != null;
                const isFm = group.unit === "fm";
                const hasPieces = isM2 || isFm;
                const multiRow = group.rows.length > 1;

                // Total fm across all rows
                const totalFmAll = hasPieces
                  ? group.rows.reduce((s, r) =>
                      s + (r.piece_count != null ? r.piece_count * r.quantity : r.quantity), 0)
                  : null;
                const totalM2All = isM2 && totalFmAll != null
                  ? totalFmAll * group.full_width!
                  : null;

                const bgClass = gIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50";

                if (!multiRow) {
                  // Single row — compact display
                  const row = group.rows[0];
                  const rowFm = hasPieces && row.piece_count != null
                    ? row.piece_count * row.quantity : null;
                  const rowM2 = isM2 && rowFm != null ? rowFm * group.full_width! : null;
                  return (
                    <tr key={gIdx} className={bgClass}>
                      <td className="py-2 pr-2 text-gray-400">{gIdx + 1}</td>
                      <td className="py-2 pr-4 text-gray-700">{group.label}</td>
                      <td className="py-2 text-right text-gray-700 whitespace-nowrap">
                        {hasPieces && row.piece_count != null ? (
                          <>
                            {row.piece_count} db × {row.quantity} fm
                            {rowM2 != null && (
                              <><br /><span className="text-gray-400 text-xs">= {rowM2.toFixed(2)} m²</span></>
                            )}
                            {isFm && rowFm != null && (
                              <><br /><span className="text-gray-400 text-xs">= {rowFm.toFixed(2)} fm</span></>
                            )}
                          </>
                        ) : (
                          <>{row.quantity} {UNIT_LABELS[group.unit] ?? group.unit}</>
                        )}
                      </td>
                      <td className="py-2 text-right text-gray-700 whitespace-nowrap">
                        {formatCurrency(group.unit_price)}/{isM2 ? "m²" : UNIT_LABELS[group.unit] ?? group.unit}
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {group.eff_discount > 0 ? `${group.eff_discount.toFixed(1)}%` : "—"}
                      </td>
                      <td className="py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                        {formatCurrency(group.group_total)}
                      </td>
                    </tr>
                  );
                }

                // Multi-row group
                return (
                  <tbody key={gIdx} className={bgClass}>
                    {/* Header row: product name */}
                    <tr className={bgClass}>
                      <td className="pt-2 pb-0.5 pr-2 text-gray-400 align-top">{gIdx + 1}</td>
                      <td colSpan={5} className="pt-2 pb-0.5 text-gray-800 font-medium">{group.label}</td>
                    </tr>
                    {/* Individual quantity rows */}
                    {group.rows.map((row, rIdx) => {
                      const rowFm = hasPieces && row.piece_count != null
                        ? row.piece_count * row.quantity : null;
                      const rowM2 = isM2 && rowFm != null ? rowFm * group.full_width! : null;
                      return (
                        <tr key={rIdx} className={bgClass}>
                          <td />
                          <td className="py-0.5 pl-3 text-gray-500 text-sm">
                            {hasPieces && row.piece_count != null
                              ? `${row.piece_count} db × ${row.quantity.toFixed(2)} fm`
                              : `${row.quantity} ${UNIT_LABELS[row.piece_count != null ? "fm" : group.unit] ?? group.unit}`}
                          </td>
                          <td className="py-0.5 text-right text-gray-400 text-xs whitespace-nowrap">
                            {rowM2 != null && `= ${rowM2.toFixed(2)} m²`}
                            {isFm && rowFm != null && `= ${rowFm.toFixed(2)} fm`}
                          </td>
                          <td /><td /><td />
                        </tr>
                      );
                    })}
                    {/* Summary row */}
                    <tr className={bgClass}>
                      <td />
                      <td />
                      <td className="pt-0.5 pb-2 text-right text-gray-600 text-xs whitespace-nowrap">
                        {totalM2All != null
                          ? `Összesen: ${totalFmAll?.toFixed(2)} fm = ${totalM2All.toFixed(2)} m²`
                          : totalFmAll != null
                          ? `Összesen: ${totalFmAll.toFixed(2)} fm`
                          : null}
                      </td>
                      <td className="pt-0.5 pb-2 text-right text-gray-700 whitespace-nowrap text-sm">
                        {formatCurrency(group.unit_price)}/{isM2 ? "m²" : UNIT_LABELS[group.unit] ?? group.unit}
                      </td>
                      <td className="pt-0.5 pb-2 text-right text-gray-500 text-sm">
                        {group.eff_discount > 0 ? `${group.eff_discount.toFixed(1)}%` : "—"}
                      </td>
                      <td className="pt-0.5 pb-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                        {formatCurrency(group.group_total)}
                      </td>
                    </tr>
                  </tbody>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="min-w-[280px] space-y-1.5 text-sm">
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">Nettó összesen:</span>
                <span className="font-semibold">{formatCurrency(netTotal)}</span>
              </div>
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
