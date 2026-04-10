"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import KanbanBoard from "@/components/KanbanBoard";
import FilterBar, { type FilterState } from "@/components/FilterBar";

function BoardContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    assigneeId: null,
    priority: null,
  });

  // Apply assignee filter from URL query (from Team page)
  useEffect(() => {
    const assignee = searchParams.get("assignee");
    if (assignee) {
      setFilters((prev) => ({ ...prev, assigneeId: Number(assignee) }));
    }
  }, [searchParams]);

  return (
    <>
      <Header title="Board" />
      <div className="px-6 pt-4 pb-2 shrink-0">
        <FilterBar filters={filters} onFilterChange={setFilters} />
      </div>
      <main className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
        <KanbanBoard filters={filters} />
      </main>
    </>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BoardContent />
    </Suspense>
  );
}
