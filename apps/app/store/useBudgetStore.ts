import { create } from 'zustand';
import { BudgetItemModel } from '@/services/proToolsApi';

export interface AppliedBudgetResult {
  requestId?: string;
  totalPrice: number;
  breakdownText: string;
  estimatedDays: number;
  timestamp: number;
}

interface BudgetStoreState {
  appliedBudget: AppliedBudgetResult | null;
  setAppliedBudget: (budget: AppliedBudgetResult | null) => void;
  consumeAppliedBudget: (requestId?: string) => AppliedBudgetResult | null;
}

export const useBudgetStore = create<BudgetStoreState>((set, get) => ({
  appliedBudget: null,
  setAppliedBudget: (appliedBudget) => set({ appliedBudget }),
  consumeAppliedBudget: (requestId) => {
    const current = get().appliedBudget;
    if (!current) return null;
    if (requestId && current.requestId && current.requestId !== requestId) {
      return null;
    }
    set({ appliedBudget: null });
    return current;
  },
}));
