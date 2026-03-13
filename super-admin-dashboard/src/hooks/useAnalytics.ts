import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useTimeFilterStore } from '../store/timeFilterStore';

export type UserEngagementRow = {
  userId: string;
  name: string | null;
  email: string | null;
  houses: number;
  favorites: number;
  messages: number;
  score: number;
};

function buildQueryParams(
  preset: string,
  fromIso?: string,
  toIso?: string,
  groupBy?: string,
  compare?: string,
) {
  const params: Record<string, string> = { groupBy: groupBy ?? 'day', compare: compare ?? 'none' };

  if (preset !== 'custom') {
    params.range = preset;
  } else if (fromIso && toIso) {
    // When selecting dates, treat "to" as inclusive by moving to the next day (backend uses exclusive upper bound)
    const toInclusive = new Date(toIso);
    toInclusive.setUTCDate(toInclusive.getUTCDate() + 1);
    params.from = fromIso;
    params.to = toInclusive.toISOString();
  }

  return params;
}

function normalizeDateRange(from?: Date, to?: Date) {
  const fromIso = from?.toISOString();
  const toIso = to?.toISOString();
  return { fromIso, toIso };
}

export function useKpis() {
  const { preset, from, to, groupBy, compare } = useTimeFilterStore();

  const { fromIso, toIso } = useMemo(() => normalizeDateRange(from, to), [from, to]);

  const params = useMemo(
    () => buildQueryParams(preset, fromIso, toIso, groupBy, compare),
    [preset, fromIso, toIso, groupBy, compare],
  );

  const queryKey = ['analytics', 'kpis', preset, fromIso, toIso, groupBy, compare];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.get('/admin/analytics/kpis', { params });
      return res.data;
    },
  });
}

export function usePlatformActivity() {
  const { preset, from, to, groupBy, compare } = useTimeFilterStore();

  const { fromIso, toIso } = useMemo(() => normalizeDateRange(from, to), [from, to]);

  const params = useMemo(
    () => buildQueryParams(preset, fromIso, toIso, groupBy, compare),
    [preset, fromIso, toIso, groupBy, compare],
  );

  const queryKey = ['analytics', 'platform-activity', preset, fromIso, toIso, groupBy, compare];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.get('/admin/analytics/platform-activity', { params });
      return res.data;
    },
  });
}

export function useUserEngagement() {
  const { preset, from, to } = useTimeFilterStore();

  const { fromIso, toIso } = useMemo(() => normalizeDateRange(from, to), [from, to]);

  const params = useMemo(
    () => buildQueryParams(preset, fromIso, toIso, 'day', 'none'),
    [preset, fromIso, toIso],
  );

  const queryKey = ['analytics', 'user-engagement', preset, fromIso, toIso];

  return useQuery<UserEngagementRow[]>({
    queryKey,
    queryFn: async () => {
      const res = await api.get('/admin/analytics/user-engagement', { params });
      return res.data as UserEngagementRow[];
    },
  });
}
