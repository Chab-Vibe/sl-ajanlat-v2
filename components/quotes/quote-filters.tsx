"use client";

import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useState, useCallback } from "react";

interface QuoteFiltersProps {
  currentStatus?: string;
  currentQ?: string;
  statuses: string[];
}

export function QuoteFilters({ currentStatus, currentQ, statuses }: QuoteFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(currentQ ?? "");

  const updateFilters = useCallback(
    (status?: string, q?: string) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Ajánlatszám vagy ügyfél neve..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateFilters(currentStatus, search);
          }}
          className="pl-9"
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearch("");
              updateFilters(currentStatus, "");
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status filters */}
      <div className="flex gap-1.5 flex-wrap">
        <Button
          variant={!currentStatus ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilters(undefined, search)}
        >
          Összes
        </Button>
        {statuses.map((s) => (
          <Button
            key={s}
            variant={currentStatus === s ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters(s, search)}
          >
            {STATUS_LABELS[s]}
          </Button>
        ))}
      </div>
    </div>
  );
}
