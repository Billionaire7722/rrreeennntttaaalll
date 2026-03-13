import React, { useMemo } from 'react';
import { formatISO, parseISO } from 'date-fns';
import { useTimeFilterStore } from '../../store/timeFilterStore';
import type { TimeGroup, ComparisonMode, TimeRangePreset } from '../../store/timeFilterStore';
import css from './TimeFilter.module.css';

const presetOptions: Array<{ value: TimeRangePreset; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

const groupByOptions: Array<{ value: TimeGroup; label: string }> = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const compareOptions: Array<{ value: ComparisonMode; label: string }> = [
  { value: 'none', label: 'No comparison' },
  { value: 'previous_period', label: 'Previous period' },
  { value: 'previous_year', label: 'Previous year' },
];

export const TimeFilter: React.FC = () => {
  const { preset, from, to, groupBy, compare, setPreset, setCustomRange, setGroupBy, setCompare } = useTimeFilterStore();

  const formattedFrom = useMemo(() => (from ? formatISO(from, { representation: 'date' }) : ''), [from]);
  const formattedTo = useMemo(() => (to ? formatISO(to, { representation: 'date' }) : ''), [to]);

  return (
    <div className={css.timeFilter}>
      <div className={css.controls}>
        <label className={css.control}>
          <span className={css.controlLabel}>Time range</span>
          <select className={css.select} value={preset} onChange={(e) => setPreset(e.target.value as TimeRangePreset)}>
            {presetOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        {preset === 'custom' && (
          <div className={css.customRange}>
            <label className={css.control}>
              <span className={css.controlLabel}>From</span>
              <input
                className={css.input}
                type="date"
                value={formattedFrom}
                onChange={(e) => {
                  const nextFrom = e.target.value ? parseISO(e.target.value) : undefined;
                  if (nextFrom && to) {
                    setCustomRange(nextFrom, to);
                  } else if (nextFrom) {
                    setCustomRange(nextFrom, nextFrom);
                  }
                }}
              />
            </label>
            <label className={css.control}>
              <span className={css.controlLabel}>To</span>
              <input
                className={css.input}
                type="date"
                value={formattedTo}
                onChange={(e) => {
                  const nextTo = e.target.value ? parseISO(e.target.value) : undefined;
                  if (from && nextTo) {
                    setCustomRange(from, nextTo);
                  } else if (nextTo) {
                    setCustomRange(nextTo, nextTo);
                  }
                }}
              />
            </label>
          </div>
        )}

        <label className={css.control}>
          <span className={css.controlLabel}>Group by</span>
          <select className={css.select} value={groupBy} onChange={(e) => setGroupBy(e.target.value as TimeGroup)}>
            {groupByOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label className={css.control}>
          <span className={css.controlLabel}>Compare</span>
          <select className={css.select} value={compare} onChange={(e) => setCompare(e.target.value as ComparisonMode)}>
            {compareOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};
