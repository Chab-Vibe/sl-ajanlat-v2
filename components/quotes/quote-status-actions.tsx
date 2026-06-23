"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateQuoteStatus, deleteQuote } from "@/app/actions/quotes";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Loader2, Trash2 } from "lucide-react";

type QuoteStatus = "draft" | "sent" | "accepted" | "declined";

const TRANSITIONS: Record<string, QuoteStatus[]> = {
  draft: ["sent"],
  sent: ["accepted", "declined", "draft"],
  accepted: ["sent"],
  declined: ["draft"],
};

interface QuoteStatusActionsProps {
  quoteId: string;
  currentStatus: string;
  canEdit: boolean;
}

export function QuoteStatusActions({
  quoteId,
  currentStatus,
  canEdit,
}: QuoteStatusActionsProps) {
  const [loading, setLoading] = useState(false);

  async function handleStatus(newStatus: "draft" | "sent" | "accepted" | "declined") {
    setLoading(true);
    try {
      await updateQuoteStatus(quoteId, newStatus);
      toast.success(`Státusz: ${STATUS_LABELS[newStatus]}`);
    } catch {
      toast.error("Hiba a státusz frissítésekor");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Biztosan törli ezt az ajánlatot? Ez nem visszafordítható."))
      return;
    setLoading(true);
    try {
      await deleteQuote(quoteId);
    } catch {
      toast.error("Hiba a törléskor");
      setLoading(false);
    }
  }

  const transitions = TRANSITIONS[currentStatus] ?? [];

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold",
          STATUS_COLORS[currentStatus]
        )}
      >
        {STATUS_LABELS[currentStatus]}
      </div>

      {canEdit && transitions.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {transitions.map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={loading}
              onClick={() => handleStatus(s)}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              → {STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      )}

      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-destructive hover:text-destructive mt-2"
          disabled={loading}
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Törlés
        </Button>
      )}
    </div>
  );
}
