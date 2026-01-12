import { useCallback, useMemo, useState } from "react";

export interface Expert {
  id: string;
  name: string;
  expertise: string;
  category?: string;
  isActive: boolean;
}

export interface UseExpertsOptions {
  initialExperts?: Expert[];
}

export function useExperts(options: UseExpertsOptions = {}) {
  const [experts, setExperts] = useState<Expert[]>(options.initialExperts ?? []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const activeExperts = useMemo(
    () => experts.filter((e) => e.isActive),
    [experts]
  );

  const selectedExperts = useMemo(
    () => experts.filter((e) => selectedIds.has(e.id)),
    [experts, selectedIds]
  );

  const expertsByCategory = useMemo(() => {
    return experts.reduce(
      (acc, expert) => {
        const category = expert.category ?? "General";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(expert);
        return acc;
      },
      {} as Record<string, Expert[]>
    );
  }, [experts]);

  const toggleSelection = useCallback((expertId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(expertId)) {
        next.delete(expertId);
      } else {
        next.add(expertId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(activeExperts.map((e) => e.id)));
  }, [activeExperts]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (expertId: string) => selectedIds.has(expertId),
    [selectedIds]
  );

  const addExpert = useCallback((expert: Expert) => {
    setExperts((prev) => [...prev, expert]);
  }, []);

  const removeExpert = useCallback((expertId: string) => {
    setExperts((prev) => prev.filter((e) => e.id !== expertId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(expertId);
      return next;
    });
  }, []);

  const updateExpert = useCallback((expertId: string, updates: Partial<Expert>) => {
    setExperts((prev) =>
      prev.map((e) => (e.id === expertId ? { ...e, ...updates } : e))
    );
  }, []);

  return {
    experts,
    activeExperts,
    selectedExperts,
    selectedIds,
    expertsByCategory,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
    addExpert,
    removeExpert,
    updateExpert,
    setExperts,
  };
}
