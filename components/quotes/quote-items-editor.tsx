"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency, calcLineTotal, calcEffectiveDiscount } from "@/lib/utils";
import { Plus, Trash2, X } from "lucide-react";
import type {
  ProductCategory,
  Manufacturer,
  Product,
  ColorPalette,
  ProductVariant,
  QuoteItemFormData,
  QuoteItemQuantityRow,
} from "@/types";

interface QuoteItemsEditorProps {
  items: QuoteItemFormData[];
  onItemsChange: (items: QuoteItemFormData[]) => void;
  categories: ProductCategory[];
  manufacturers: Manufacturer[];
  products: Product[];
  palettes: ColorPalette[];
  variants: ProductVariant[];
  globalDiscount: number;
}

type SelState = {
  catId: string;
  mfrId: string;
  baseName: string;
  thickness: string;
  isCustomMode: boolean;
};

const DEFAULT_SEL: SelState = {
  catId: "", mfrId: "", baseName: "", thickness: "", isCustomMode: false,
};

let nextId = 1;
function makeId() { return `new-${nextId++}`; }

function blankRow(withAnticondens = false): QuoteItemQuantityRow {
  return { piece_count: null, quantity: 1, with_anticondens: withAnticondens };
}

function blankItem(unit = "m2", anticondensPrice = 0, defaultAnticondens = false): QuoteItemFormData {
  return {
    id: makeId(),
    product_id: "",
    variant_id: "",
    custom_description: "",
    quantity_rows: [blankRow(defaultAnticondens)],
    unit,
    unit_price_base: 0,
    unit_price_override: null,
    discount_percent: 0,
    color_code: null,
    sort_order: 0,
    anticondens_price: anticondensPrice,
  };
}

function initSel(item: QuoteItemFormData, products: Product[]): SelState {
  if (!item.product_id) return { ...DEFAULT_SEL, isCustomMode: true };
  const p = products.find((x) => x.id === item.product_id);
  if (!p) return DEFAULT_SEL;
  return {
    catId: p.category_id,
    mfrId: p.manufacturer_id,
    baseName: p.name,
    thickness: p.thickness ?? "",
    isCustomMode: false,
  };
}


export function QuoteItemsEditor({
  items,
  onItemsChange,
  categories,
  manufacturers,
  products,
  palettes,
  variants,
  globalDiscount,
}: QuoteItemsEditorProps) {
  const [sels, setSels] = useState<Record<string, SelState>>(() =>
    Object.fromEntries(items.map((item) => [item.id!, initSel(item, products)]))
  );

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const paletteMap = useMemo(() => new Map(palettes.map((p) => [p.id, p])), [palettes]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const manufacturerMap = useMemo(() => new Map(manufacturers.map((m) => [m.id, m])), [manufacturers]);

  const mfrsByCat = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const p of products) {
      if (!map.has(p.category_id)) map.set(p.category_id, new Set());
      map.get(p.category_id)!.add(p.manufacturer_id);
    }
    return map;
  }, [products]);

  function getSel(itemId: string): SelState {
    return sels[itemId] ?? DEFAULT_SEL;
  }
  function setSel(itemId: string, patch: Partial<SelState>) {
    setSels((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] ?? DEFAULT_SEL), ...patch } }));
  }
  function updateItem(itemId: string, patch: Partial<QuoteItemFormData>) {
    onItemsChange(items.map((it) => it.id === itemId ? { ...it, ...patch } : it));
  }

  // ---- Block management ----
  function addItem() {
    const item = blankItem();
    onItemsChange([...items, item]);
    setSels((prev) => ({ ...prev, [item.id!]: DEFAULT_SEL }));
  }
  function addCustomItem() {
    const item = { ...blankItem("db"), product_id: "" };
    onItemsChange([...items, item]);
    setSels((prev) => ({ ...prev, [item.id!]: { ...DEFAULT_SEL, isCustomMode: true } }));
  }
  function removeItem(itemId: string) {
    onItemsChange(items.filter((it) => it.id !== itemId));
    setSels((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
  }

  // ---- Quantity row management ----
  function addRow(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const defaultAC = item.anticondens_price > 0;
    updateItem(itemId, { quantity_rows: [...item.quantity_rows, blankRow(defaultAC)] });
  }
  function updateRow(itemId: string, rowIdx: number, patch: Partial<QuoteItemQuantityRow>) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const rows = item.quantity_rows.map((r, i) => i === rowIdx ? { ...r, ...patch } : r);
    updateItem(itemId, { quantity_rows: rows });
  }
  function removeRow(itemId: string, rowIdx: number) {
    const item = items.find((i) => i.id === itemId);
    if (!item || item.quantity_rows.length <= 1) return;
    updateItem(itemId, { quantity_rows: item.quantity_rows.filter((_, i) => i !== rowIdx) });
  }

  // ---- Cascade helpers ----
  function getCatProducts(catId: string) {
    return products.filter((p) => p.category_id === catId && p.is_active);
  }
  function showManufacturer(catId: string): boolean {
    return (mfrsByCat.get(catId)?.size ?? 0) > 1;
  }
  function getMfrsForCat(catId: string): Manufacturer[] {
    const ids = mfrsByCat.get(catId) ?? new Set();
    return manufacturers.filter((m) => ids.has(m.id));
  }
  function getBaseNames(catId: string, mfrId: string): string[] {
    const filtered = getCatProducts(catId).filter((p) => !mfrId || p.manufacturer_id === mfrId);
    return [...new Set(filtered.map((p) => p.name))].sort();
  }
  function getThicknesses(catId: string, mfrId: string, baseName: string): string[] {
    const filtered = getCatProducts(catId).filter(
      (p) => p.name === baseName && (!mfrId || p.manufacturer_id === mfrId)
    );
    const ts = filtered.map((p) => p.thickness).filter(Boolean) as string[];
    return [...new Set(ts)];
  }
  function getFinalProduct(catId: string, mfrId: string, baseName: string, thickness: string): Product | null {
    return getCatProducts(catId).find(
      (p) => p.name === baseName && (!mfrId || p.manufacturer_id === mfrId) &&
        (p.thickness === thickness || (!thickness && !p.thickness))
    ) ?? null;
  }
  function getVariantsForProduct(productId: string): ProductVariant[] {
    return variants.filter((v) => v.product_id === productId && v.is_available);
  }
  function getPaletteColors(paletteId: string): string[] {
    return (paletteMap.get(paletteId)?.colors as string[]) ?? [];
  }

  // ---- Cascade event handlers ----
  function resetRows(withAnticondens = false): QuoteItemQuantityRow[] {
    return [blankRow(withAnticondens)];
  }
  function itemAnticondensDefault(itemId: string): boolean {
    return (items.find((i) => i.id === itemId)?.anticondens_price ?? 0) > 0;
  }

  function onCatChange(itemId: string, catId: string) {
    const cat = categoryMap.get(catId);
    const defaultAC = cat?.default_anticondens ?? false;
    const acPrice = defaultAC ? 800 : 0;
    setSel(itemId, { catId, mfrId: "", baseName: "", thickness: "" });
    updateItem(itemId, {
      product_id: "", variant_id: "", unit: cat?.unit ?? "m2",
      unit_price_base: 0, unit_price_override: null,
      quantity_rows: resetRows(defaultAC), color_code: null,
      anticondens_price: acPrice,
    });
  }
  function onMfrChange(itemId: string, mfrId: string) {
    const ac = itemAnticondensDefault(itemId);
    setSel(itemId, { mfrId, baseName: "", thickness: "" });
    updateItem(itemId, {
      product_id: "", variant_id: "", unit_price_base: 0,
      unit_price_override: null, quantity_rows: resetRows(ac), color_code: null,
    });
  }
  function onBaseNameChange(itemId: string, baseName: string) {
    const sel = getSel(itemId);
    const ac = itemAnticondensDefault(itemId);
    const thicknesses = getThicknesses(sel.catId, sel.mfrId, baseName);
    const autoThickness = thicknesses.length === 1 ? thicknesses[0] : "";
    setSel(itemId, { baseName, thickness: autoThickness });
    if (autoThickness !== "" || thicknesses.length === 0) {
      const prod = getFinalProduct(sel.catId, sel.mfrId, baseName, autoThickness);
      const cat = prod ? categoryMap.get(prod.category_id) : null;
      updateItem(itemId, {
        product_id: prod?.id ?? "", variant_id: "",
        unit: cat?.unit ?? "m2", unit_price_base: 0,
        unit_price_override: null, quantity_rows: resetRows(ac), color_code: null,
      });
    } else {
      updateItem(itemId, {
        product_id: "", variant_id: "", unit_price_base: 0,
        unit_price_override: null, quantity_rows: resetRows(ac), color_code: null,
      });
    }
  }
  function onThicknessChange(itemId: string, thickness: string) {
    const sel = getSel(itemId);
    const ac = itemAnticondensDefault(itemId);
    setSel(itemId, { thickness });
    const prod = getFinalProduct(sel.catId, sel.mfrId, sel.baseName, thickness);
    const cat = prod ? categoryMap.get(prod.category_id) : null;
    updateItem(itemId, {
      product_id: prod?.id ?? "", variant_id: "",
      unit: cat?.unit ?? "m2", unit_price_base: 0,
      unit_price_override: null, quantity_rows: resetRows(ac), color_code: null,
    });
  }
  function onVariantChange(itemId: string, variantId: string) {
    const v = variants.find((x) => x.id === variantId);
    if (!v) return;
    updateItem(itemId, {
      variant_id: variantId, unit_price_base: v.price_net,
      unit_price_override: null, color_code: v.color_code ?? null,
    });
  }

  // ---- Grand total ----
  const grandTotal = useMemo(
    () => items.reduce((sum, item) => {
      const product = item.product_id ? productMap.get(item.product_id) : null;
      const basePrice = item.unit_price_override ?? item.unit_price_base;
      const effDiscount = calcEffectiveDiscount(item.discount_percent, globalDiscount);
      return sum + item.quantity_rows.reduce((rSum, row) => {
        const rowPrice = basePrice + (row.with_anticondens ? item.anticondens_price : 0);
        return rSum + calcLineTotal(row.quantity, product?.full_width ?? null, rowPrice, effDiscount, item.unit, row.piece_count);
      }, 0);
    }, 0),
    [items, globalDiscount, productMap]
  );

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="text-sm">Még nincs tétel hozzáadva</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => {
            const itemId = item.id!;
            const sel = getSel(itemId);
            const product = item.product_id ? productMap.get(item.product_id) : null;
            const category = product
              ? categoryMap.get(product.category_id)
              : sel.catId ? categoryMap.get(sel.catId) : null;
            const catUnit = category?.unit ?? item.unit;
            const isM2 = catUnit === "m2";
            const isFm = catUnit === "fm";
            const isDb = catUnit === "db";
            const hasPieces = isM2 || isFm; // darabszám + hossz

            const hasMfr = showManufacturer(sel.catId);
            const baseNames = sel.catId ? getBaseNames(sel.catId, hasMfr ? sel.mfrId : "") : [];
            const thicknesses = sel.baseName
              ? getThicknesses(sel.catId, hasMfr ? sel.mfrId : "", sel.baseName)
              : [];
            const showThickness = thicknesses.length > 1;

            const productVariants = item.product_id ? getVariantsForProduct(item.product_id) : [];
            const selectedVariant = item.variant_id
              ? variants.find((v) => v.id === item.variant_id)
              : null;
            const isPaletteVariant = !!selectedVariant?.palette_id;
            const paletteColors = isPaletteVariant
              ? getPaletteColors(selectedVariant!.palette_id!)
              : [];

            const basePrice = item.unit_price_override ?? item.unit_price_base;
            const effDiscount = calcEffectiveDiscount(item.discount_percent, globalDiscount);
            const isAnticondensActive = isM2 && item.anticondens_price > 0;

            // Group totals
            const totalFmAll = hasPieces
              ? item.quantity_rows.reduce((s, r) =>
                  s + (r.piece_count != null ? r.piece_count * r.quantity : r.quantity), 0)
              : null;
            const totalM2All = isM2 && totalFmAll != null && product?.full_width
              ? totalFmAll * product.full_width
              : null;
            const blockTotal = item.quantity_rows.reduce((s, row) => {
              const rowPrice = basePrice + (row.with_anticondens ? item.anticondens_price : 0);
              return s + calcLineTotal(row.quantity, product?.full_width ?? null, rowPrice, effDiscount, item.unit, row.piece_count);
            }, 0);

            const isCustom = sel.isCustomMode;

            return (
              <div key={itemId} className="border rounded-lg bg-card overflow-hidden">
                {/* Block header */}
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <span className="text-xs font-medium text-muted-foreground">{idx + 1}. tétel</span>
                  <Button
                    type="button" variant="ghost" size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(itemId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="px-4 pb-4 space-y-3">
                  {/* ---- Product selection ---- */}
                  {isCustom ? (
                    <div className="space-y-1">
                      <Label className="text-xs">Egyéni tétel leírása</Label>
                      <Input
                        className="h-8 text-sm"
                        placeholder="pl. Szállítási díj, Szerelés..."
                        value={item.custom_description}
                        onChange={(e) => updateItem(itemId, { custom_description: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Row 1: Category + Manufacturer */}
                      <div className={cn("grid gap-2", hasMfr ? "grid-cols-2" : "grid-cols-1")}>
                        <div className="space-y-1">
                          <Label className="text-xs">Kategória</Label>
                          <Select value={sel.catId} onValueChange={(v) => onCatChange(itemId, v)}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Kategória..." />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {hasMfr && (
                          <div className="space-y-1">
                            <Label className="text-xs">Gyártó</Label>
                            <Select value={sel.mfrId} onValueChange={(v) => onMfrChange(itemId, v)}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Gyártó..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getMfrsForCat(sel.catId).map((m) => (
                                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Row 2: Product name + Thickness */}
                      {sel.catId && (!hasMfr || sel.mfrId) && (
                        <div className={cn("grid gap-2", showThickness ? "grid-cols-2" : "grid-cols-1")}>
                          <div className="space-y-1">
                            <Label className="text-xs">Termék</Label>
                            <Select value={sel.baseName} onValueChange={(v) => onBaseNameChange(itemId, v)}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Termék neve..." />
                              </SelectTrigger>
                              <SelectContent>
                                {baseNames.map((name) => (
                                  <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {showThickness && (
                            <div className="space-y-1">
                              <Label className="text-xs">Vastagság</Label>
                              <Select value={sel.thickness} onValueChange={(v) => onThicknessChange(itemId, v)}>
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Vastagság..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {thicknesses.map((t) => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Row 3: Variant + palette color */}
                      {item.product_id && (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Felület / szín</Label>
                            <Select value={item.variant_id} onValueChange={(v) => onVariantChange(itemId, v)}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Felület..." />
                              </SelectTrigger>
                              <SelectContent>
                                {productVariants.map((v) => {
                                  const label = v.color_code
                                    ? v.color_code
                                    : v.palette_id
                                    ? (paletteMap.get(v.palette_id)?.name ?? "Paletta")
                                    : "Alap";
                                  return (
                                    <SelectItem key={v.id} value={v.id}>
                                      {label} — {formatCurrency(v.price_net)}/{isM2 ? "m²" : catUnit}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          {isPaletteVariant && paletteColors.length > 0 && (
                            <div className="space-y-1">
                              <Label className="text-xs">Szín (RAL / kód)</Label>
                              <Select
                                value={item.color_code ?? ""}
                                onValueChange={(v) => updateItem(itemId, { color_code: v })}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Szín..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {paletteColors.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {product && (product.full_width || product.thickness) && (
                            <p className="text-xs text-muted-foreground">
                              {product.thickness && <>{product.thickness}</>}
                              {product.thickness && product.full_width && " · "}
                              {product.full_width && <>Teljes szélesség: {product.full_width} m</>}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Antikondenzációs filc – csak m2 tételeknél */}
                  {isM2 && !isCustom && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border border-input accent-primary"
                          checked={isAnticondensActive}
                          onChange={(e) => {
                            const acPrice = e.target.checked ? 800 : 0;
                            updateItem(itemId, {
                              anticondens_price: acPrice,
                              quantity_rows: item.quantity_rows.map((r) => ({
                                ...r,
                                with_anticondens: e.target.checked,
                              })),
                            });
                          }}
                        />
                        <span className="text-xs">Antikondenzációs filc</span>
                      </label>
                      {isAnticondensActive && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number" min={0} step={10}
                            className="h-7 text-xs w-20"
                            value={item.anticondens_price}
                            onChange={(e) => updateItem(itemId, { anticondens_price: parseFloat(e.target.value) || 0 })}
                          />
                          <span className="text-xs text-muted-foreground">Ft/m²</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* ---- Quantity rows ---- */}
                  <div className="space-y-1.5">
                    {/* Column headers */}
                    <div className={cn(
                      "grid gap-2 text-xs text-muted-foreground px-1",
                      hasPieces
                        ? isAnticondensActive ? "grid-cols-[1fr_1fr_auto_auto]" : "grid-cols-[1fr_1fr_auto]"
                        : "grid-cols-[1fr_auto]"
                    )}>
                      {hasPieces ? (
                        <>
                          <span>Darabszám (db)</span>
                          <span>{isM2 ? "Hossz / lemez (fm)" : "Hossz (fm)"}</span>
                          {isAnticondensActive && <span className="text-center">Filc</span>}
                          <span className="w-6" />
                        </>
                      ) : (
                        <>
                          <span>Darabszám (db)</span>
                          <span className="w-6" />
                        </>
                      )}
                    </div>

                    {item.quantity_rows.map((row, rowIdx) => {
                      const rowFm = hasPieces && row.piece_count != null
                        ? row.piece_count * row.quantity
                        : null;
                      const rowM2 = isM2 && rowFm != null && product?.full_width
                        ? rowFm * product.full_width
                        : null;

                      return (
                        <div
                          key={rowIdx}
                          className={cn(
                            "grid gap-2 items-center",
                            hasPieces
                              ? isAnticondensActive ? "grid-cols-[1fr_1fr_auto_auto]" : "grid-cols-[1fr_1fr_auto]"
                              : "grid-cols-[1fr_auto]"
                          )}
                        >
                          {hasPieces ? (
                            <>
                              <Input
                                type="number" min={1} step={1}
                                className="h-8 text-sm"
                                placeholder="db"
                                value={row.piece_count ?? ""}
                                onChange={(e) => updateRow(itemId, rowIdx, {
                                  piece_count: parseInt(e.target.value) || null,
                                })}
                              />
                              <div>
                                <Input
                                  type="number" min={0} step={0.05}
                                  className="h-8 text-sm"
                                  placeholder="fm"
                                  value={row.quantity || ""}
                                  onChange={(e) => updateRow(itemId, rowIdx, {
                                    quantity: parseFloat(e.target.value) || 0,
                                  })}
                                />
                                {rowFm != null && (
                                  <p className="text-xs text-muted-foreground mt-0.5 pl-1">
                                    {rowM2 != null
                                      ? `= ${rowFm.toFixed(2)} fm · ${rowM2.toFixed(2)} m²`
                                      : `= ${rowFm.toFixed(2)} fm`}
                                  </p>
                                )}
                              </div>
                              {isAnticondensActive && (
                                <div className="flex justify-center">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border border-input accent-primary"
                                    checked={row.with_anticondens}
                                    onChange={(e) => updateRow(itemId, rowIdx, { with_anticondens: e.target.checked })}
                                    title="Antikondenzációs filc ennél a sornál"
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <Input
                              type="number" min={1} step={1}
                              className="h-8 text-sm"
                              placeholder="db"
                              value={row.quantity || ""}
                              onChange={(e) => updateRow(itemId, rowIdx, {
                                quantity: parseInt(e.target.value) || 0,
                              })}
                            />
                          )}
                          <Button
                            type="button" variant="ghost" size="icon"
                            className="h-8 w-6 text-muted-foreground hover:text-destructive"
                            disabled={item.quantity_rows.length <= 1}
                            onClick={() => removeRow(itemId, rowIdx)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}

                    <Button
                      type="button" variant="ghost" size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 mt-1"
                      onClick={() => addRow(itemId)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Sor hozzáadása
                    </Button>
                  </div>

                  {/* ---- Price + totals ---- */}
                  <Separator />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-start">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Lemez ár (Ft/{isM2 ? "m²" : catUnit})
                        {item.unit_price_override !== null && (
                          <span className="ml-1 text-amber-600">↑</span>
                        )}
                      </Label>
                      <Input
                        type="number" min={0}
                        className={cn("h-8 text-sm", item.unit_price_override !== null && "border-amber-400 bg-amber-50")}
                        value={item.unit_price_override ?? item.unit_price_base}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateItem(itemId, {
                            unit_price_override: val === item.unit_price_base ? null : val,
                          });
                        }}
                      />
                      {item.unit_price_override !== null && (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline hover:text-foreground"
                          onClick={() => updateItem(itemId, { unit_price_override: null })}
                        >
                          Visszaáll. ({formatCurrency(item.unit_price_base)})
                        </button>
                      )}
                      {isAnticondensActive && (
                        <p className="text-xs text-muted-foreground">
                          + {formatCurrency(item.anticondens_price)}/m² filc (soronként)
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Sor kedvezmény (%)</Label>
                      <Input
                        type="number" min={0} max={100} step={0.5}
                        className="h-8 text-sm"
                        value={item.discount_percent}
                        onChange={(e) => updateItem(itemId, { discount_percent: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-xs">Tétel nettó összesen</Label>
                      <div className="h-8 flex items-center font-bold text-base">
                        {formatCurrency(blockTotal)}
                      </div>
                      {totalM2All != null && (
                        <p className="text-xs text-muted-foreground">
                          Összesen: {totalFmAll?.toFixed(2)} fm = {totalM2All.toFixed(2)} m²
                        </p>
                      )}
                      {isFm && totalFmAll != null && (
                        <p className="text-xs text-muted-foreground">
                          Összesen: {totalFmAll.toFixed(2)} fm
                        </p>
                      )}
                      {effDiscount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {effDiscount.toFixed(1)}% össz. kedvezmény
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add buttons */}
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4" />
          Tétel hozzáadása
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addCustomItem}>
          <Plus className="h-4 w-4" />
          Egyéni tétel
        </Button>
      </div>

      {/* Grand total */}
      {items.length > 0 && (
        <div className="flex justify-end">
          <div className="bg-muted rounded-lg p-4 min-w-[280px] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Nettó összesen:</span>
              <span className="font-bold">{formatCurrency(grandTotal)}</span>
            </div>
            {globalDiscount > 0 && (
              <p className="text-xs text-muted-foreground text-right">
                Globális {globalDiscount}% kedvezmény alkalmazva
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
