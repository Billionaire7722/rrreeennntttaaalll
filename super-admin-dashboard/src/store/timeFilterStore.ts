import { create } from 'zustand';

export type TimeGroup = 'hour' | 'day' | 'week' | 'month' | 'year';
export type ComparisonMode = 'none' | 'previous_period' | 'previous_year';

export type TimeRangePreset = '7d' | '30d' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export interface TimeFilterState {
  preset: TimeRangePreset;
  from?: Date;
  to?: Date;
  groupBy: TimeGroup;
  compare: ComparisonMode;
  setPreset: (preset: TimeRangePreset) => void;
  setCustomRange: (from: Date, to: Date) => void;
  setGroupBy: (groupBy: TimeGroup) => void;
  setCompare: (compare: ComparisonMode) => void;
}

export const useTimeFilterStore = create<TimeFilterState>((set) => ({
  preset: '30d',
  from: undefined,
  to: undefined,
  groupBy: 'day',
  compare: 'none',

  setPreset: (preset) => set(() => {
    if (preset !== 'custom') {
      return { preset, from: undefined, to: undefined };
    }
    return { preset };
  }),

  setCustomRange: (from, to) => set({ preset: 'custom', from, to }),
  setGroupBy: (groupBy) => set({ groupBy }),
  setCompare: (compare) => set({ compare }),
}));
