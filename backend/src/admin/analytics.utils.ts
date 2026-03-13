export type TimeGroup = 'hour' | 'day' | 'week' | 'month' | 'year';

export type ComparisonMode = 'none' | 'previous_period' | 'previous_year';

export interface TimeFilter {
  from: Date;
  to: Date; // exclusive
  groupBy: TimeGroup;
  compare: ComparisonMode;
}

export function parseTimeFilter(
  opts: { range?: string; from?: string; to?: string; groupBy?: string; compare?: string }
): TimeFilter {
  const now = new Date();
  let from: Date;
  let to: Date;

  // If explicit from/to provided, prefer them.
  if (opts.from || opts.to) {
    from = opts.from ? new Date(opts.from) : new Date(0);
    to = opts.to ? new Date(opts.to) : now;
  } else {
    // Range shorthand (e.g. 7d, 30d, this_month, last_month, this_year)
    switch (opts.range) {
      case '7d':
        to = now;
        from = new Date(now);
        from.setDate(from.getDate() - 7);
        break;
      case '30d':
        to = now;
        from = new Date(now);
        from.setDate(from.getDate() - 30);
        break;
      case 'this_month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'last_month':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'this_year':
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        // default: last 30 days
        to = now;
        from = new Date(now);
        from.setDate(from.getDate() - 30);
        break;
    }
  }

  // Normalize to UTC boundaries
  const fromUtc = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), from.getUTCHours(), from.getUTCMinutes(), from.getUTCSeconds(), from.getUTCMilliseconds()));
  const toUtc = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), to.getUTCHours(), to.getUTCMinutes(), to.getUTCSeconds(), to.getUTCMilliseconds()));

  const groupBy = (['hour', 'day', 'week', 'month', 'year'] as const).includes(opts.groupBy as any)
    ? (opts.groupBy as TimeGroup)
    : 'day';

  const compare = (['none', 'previous_period', 'previous_year'] as const).includes(opts.compare as any)
    ? (opts.compare as ComparisonMode)
    : 'none';

  return { from: fromUtc, to: toUtc, groupBy, compare };
}

export function getDateTruncExpression(groupBy: TimeGroup): string {
  // PostgreSQL date_trunc
  return `date_trunc('${groupBy}', \"%COLUMN%\")`;
}

export function formatTimeGroupLabel(groupBy: TimeGroup, date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  switch (groupBy) {
    case 'hour':
      return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:00`;
    case 'day':
      return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    case 'week': {
      const year = date.getUTCFullYear();
      const week = getISOWeek(date);
      return `${year}-W${week.toString().padStart(2, '0')}`;
    }
    case 'month':
      return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
    case 'year':
      return `${date.getUTCFullYear()}`;
  }
}

function getISOWeek(date: Date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}
