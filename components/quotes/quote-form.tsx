"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createQuote, updateQuote } from "@/app/actions/quotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { QuoteItemsEditor } from "./quote-items-editor";
import { cn, validateTaxNumber } from "@/lib/utils";
import { Loader2, Save, FileDown, User, Building2 } from "lucide-react";
import type {
  ProductCategory,
  Manufacturer,
  Product,
  ColorPalette,
  ProductVariant,
  QuoteFormData,
  QuoteItemFormData,
} from "@/types";

interface QuoteFormProps {
  categories: ProductCategory[];
  manufacturers: Manufacturer[];
  products: Product[];
  palettes: ColorPalette[];
  variants: ProductVariant[];
  initialData?: Partial<QuoteFormData>;
  quoteId?: string;
}

export function QuoteForm({
  categories,
  manufacturers,
  products,
  palettes,
  variants,
  initialData,
  quoteId,
}: QuoteFormProps) {
  const router = useRouter();

  const [customerType, setCustomerType] = useState<"magánszemély" | "cég">(
    initialData?.customer_type ?? "magánszemély"
  );
  const [name, setName] = useState(initialData?.customer_name ?? "");
  const [email, setEmail] = useState(initialData?.customer_email ?? "");
  const [phone, setPhone] = useState(initialData?.customer_phone ?? "");
  const [address, setAddress] = useState(initialData?.customer_address ?? "");
  const [taxNumber, setTaxNumber] = useState(initialData?.customer_tax_number ?? "");
  const [vatType, setVatType] = useState<"normál" | "fordított">(
    initialData?.vat_type ?? "normál"
  );
  const [globalDiscount, setGlobalDiscount] = useState(
    initialData?.global_discount ?? 0
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [validUntil, setValidUntil] = useState(initialData?.valid_until ?? "");
  const [items, setItems] = useState<QuoteItemFormData[]>(initialData?.items ?? []);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Kötelező mező";
    if (customerType === "cég" && !taxNumber.trim()) {
      newErrors.taxNumber = "Céges vevőnél az adószám kötelező";
    } else if (customerType === "cég" && !validateTaxNumber(taxNumber)) {
      newErrors.taxNumber = "Érvénytelen adószám formátum (pl. 12345678-1-42)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave(saveMode: "draft" | "pdf-only") {
    if (!validate()) {
      toast.error("Kérjük javítsa a hibákat");
      return;
    }
    setSaving(true);
    try {
      const formData: QuoteFormData = {
        customer_type: customerType,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        customer_address: address,
        customer_tax_number: taxNumber,
        vat_type: vatType,
        global_discount: globalDiscount,
        notes,
        valid_until: validUntil,
        items,
      };

      let targetId: string;
      if (quoteId) {
        await updateQuote(quoteId, formData);
        targetId = quoteId;
      } else {
        targetId = await createQuote(formData, saveMode !== "pdf-only");
      }
      toast.success("Ajánlat mentve");

      if (saveMode === "pdf-only") {
        router.push(`/quotes/${targetId}/pdf`);
      } else {
        router.push(`/quotes/${targetId}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hiba történt");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Customer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Ügyfél adatai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer type toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCustomerType("magánszemély")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                customerType === "magánszemély"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              )}
            >
              <User className="h-4 w-4" />
              Magánszemély
            </button>
            <button
              type="button"
              onClick={() => setCustomerType("cég")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                customerType === "cég"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              )}
            >
              <Building2 className="h-4 w-4" />
              Cég
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                {customerType === "cég" ? "Cégnév" : "Név"} *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={customerType === "cég" ? "Példa Kft." : "Kiss János"}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {customerType === "cég" && (
              <div className="space-y-1.5">
                <Label htmlFor="taxNumber">Adószám *</Label>
                <Input
                  id="taxNumber"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="12345678-1-42"
                  className={errors.taxNumber ? "border-destructive" : ""}
                />
                {errors.taxNumber && (
                  <p className="text-xs text-destructive">{errors.taxNumber}</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pelda@email.hu"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+36 30 123 4567"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="address">Cím</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="1234 Budapest, Példa utca 1."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Tételek</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteItemsEditor
            items={items}
            onItemsChange={setItems}
            categories={categories}
            manufacturers={manufacturers}
            products={products}
            palettes={palettes}
            variants={variants}
            globalDiscount={globalDiscount}
          />
        </CardContent>
      </Card>

      {/* 3. Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Ajánlat beállításai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="globalDiscount">Globális kedvezmény (%)</Label>
              <Input
                id="globalDiscount"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                A soronkénti kedvezmény mellé adódik
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="validUntil">Érvényesség</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>ÁFA típus</Label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={vatType === "fordított"}
                  onCheckedChange={(v) => setVatType(v ? "fordított" : "normál")}
                />
                <span className="text-sm">
                  {vatType === "fordított" ? (
                    <span className="text-amber-700 font-medium">Fordított ÁFA</span>
                  ) : (
                    <span className="text-muted-foreground">Normál ÁFA (27%)</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="notes">Megjegyzések</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Szállítási feltételek, különleges kérések..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="fixed bottom-0 left-60 right-0 bg-background border-t px-6 py-4 flex items-center justify-end gap-3 shadow-lg z-30">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={saving}
        >
          Mégsem
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSave("pdf-only")}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          Csak PDF (nem ment)
        </Button>
        <Button
          variant="accent"
          onClick={() => handleSave("draft")}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Mentés
        </Button>
      </div>
    </div>
  );
}
