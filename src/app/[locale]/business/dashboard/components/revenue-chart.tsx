'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Euro, Users, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

type Period = 'week' | 'month' | '6months';
type Metric = 'revenue' | 'clients';

const periodLabels: Record<Period, string> = {
  week: '7 jours',
  month: '30 jours',
  '6months': '6 mois',
};

const metricLabels: Record<Metric, string> = {
  revenue: 'CA',
  clients: 'Clients',
};

function getDateRange(period: Period): { from: Date; to: Date } {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();

  if (period === 'week') {
    from.setDate(from.getDate() - 6);
  } else if (period === 'month') {
    from.setDate(from.getDate() - 29);
  } else {
    from.setMonth(from.getMonth() - 6);
  }
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

/** YYYY-MM-DD in local time (matches how the cursor iterates). */
function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Fill missing days for revenue data (cumulative) */
function fillRevenueDays(
  data: { date: string; revenue: number; count: number }[],
  from: Date,
  to: Date,
  period: Period
): { label: string; value: number; count: number }[] {
  const dataMap = new Map(data.map((d) => [d.date, d]));

  if (period === '6months') {
    const weeks: { label: string; value: number; count: number }[] = [];
    const cursor = new Date(from);
    let cumulative = 0;
    while (cursor <= to) {
      let weekCount = 0;
      const weekStart = new Date(cursor);
      for (let i = 0; i < 7 && cursor <= to; i++) {
        const key = localDayKey(cursor);
        const entry = dataMap.get(key);
        if (entry) {
          cumulative += entry.revenue;
          weekCount += entry.count;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push({
        label: weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        value: cumulative,
        count: weekCount,
      });
    }
    return weeks;
  }

  const result: { label: string; value: number; count: number }[] = [];
  const cursor = new Date(from);
  let cumulative = 0;
  while (cursor <= to) {
    const key = localDayKey(cursor);
    const entry = dataMap.get(key);
    if (entry) {
      cumulative += entry.revenue;
    }
    result.push({
      label:
        period === 'week'
          ? cursor.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
          : cursor.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      value: cumulative,
      count: entry?.count ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

/** Fill missing days for client growth data (cumulative) */
function fillClientDays(
  data: { date: string; count: number }[],
  baseCount: number,
  from: Date,
  to: Date,
  period: Period
): { label: string; value: number; count: number }[] {
  const dataMap = new Map(data.map((d) => [d.date, d.count]));

  if (period === '6months') {
    const weeks: { label: string; value: number; count: number }[] = [];
    const cursor = new Date(from);
    let cumulative = baseCount;
    while (cursor <= to) {
      const weekStart = new Date(cursor);
      let weekNew = 0;
      for (let i = 0; i < 7 && cursor <= to; i++) {
        const key = localDayKey(cursor);
        const dayCount = dataMap.get(key) || 0;
        cumulative += dayCount;
        weekNew += dayCount;
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push({
        label: weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        value: cumulative,
        count: weekNew,
      });
    }
    return weeks;
  }

  const result: { label: string; value: number; count: number }[] = [];
  const cursor = new Date(from);
  let cumulative = baseCount;
  while (cursor <= to) {
    const key = localDayKey(cursor);
    const dayCount = dataMap.get(key) || 0;
    cumulative += dayCount;
    result.push({
      label:
        period === 'week'
          ? cursor.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
          : cursor.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      value: cumulative,
      count: dayCount,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

const CHART_BLUE = '#4f7df9';
const CHART_GREEN = '#10b981';

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-medium mb-1">{label}</p>
      <p style={{ color: CHART_BLUE }} className="font-semibold">{formatPrice(payload[0].value)}</p>
      <p className="text-muted-foreground text-xs">{payload[0].payload.count} prestation{payload[0].payload.count > 1 ? 's' : ''}</p>
    </div>
  );
}

function ClientsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-medium mb-1">{label}</p>
      <p style={{ color: CHART_GREEN }} className="font-semibold">{payload[0].value} client{payload[0].value > 1 ? 's' : ''}</p>
      {payload[0].payload.count > 0 && (
        <p className="text-muted-foreground text-xs">+{payload[0].payload.count} nouveau{payload[0].payload.count > 1 ? 'x' : ''}</p>
      )}
    </div>
  );
}

export function RevenueChart() {
  const [period, setPeriod] = useState<Period>('month');
  const [metric, setMetric] = useState<Metric>('revenue');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { from, to } = useMemo(() => getDateRange(period), [period]);

  // Revenue data
  const { data: revenueRaw, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-stats', period],
    queryFn: () => api.getRevenueStats(from.toISOString(), to.toISOString()),
    enabled: metric === 'revenue',
    retry: false,
  });

  // Client growth data
  const { data: clientsRaw, isLoading: clientsLoading } = useQuery({
    queryKey: ['client-growth-stats', period],
    queryFn: () => api.getClientGrowthStats(from.toISOString(), to.toISOString()),
    enabled: metric === 'clients',
    retry: false,
  });

  const revenueData = useMemo(
    () => fillRevenueDays(revenueRaw || [], from, to, period),
    [revenueRaw, from, to, period]
  );

  const clientsData = useMemo(
    () => fillClientDays(clientsRaw?.daily || [], clientsRaw?.baseCount || 0, from, to, period),
    [clientsRaw, from, to, period]
  );

  const chartData = metric === 'revenue' ? revenueData : clientsData;
  const isLoading = metric === 'revenue' ? revenueLoading : clientsLoading;
  const chartColor = metric === 'revenue' ? CHART_BLUE : CHART_GREEN;
  const gradientId = metric === 'revenue' ? 'revenueGradient' : 'clientsGradient';

  const totalRevenue = revenueData.length > 0 ? revenueData[revenueData.length - 1].value : 0;
  const totalBookings = revenueData.reduce((sum, d) => sum + d.count, 0);
  const currentClients = clientsData.length > 0 ? clientsData[clientsData.length - 1].value : 0;
  const newClients = clientsData.reduce((sum, d) => sum + d.count, 0);

  const isEmpty = metric === 'revenue'
    ? totalRevenue === 0
    : currentClients === 0 && newClients === 0;

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 mb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={metric}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                metric === 'revenue'
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-emerald-100 dark:bg-emerald-900/30'
              }`}
            >
              {metric === 'revenue' ? (
                <Euro className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </motion.div>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.div
              key={metric}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {metric === 'revenue' ? (
                <>
                  <h3 className="font-semibold text-sm sm:text-base">Chiffre d&apos;affaires</h3>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground text-base sm:text-lg">{formatPrice(totalRevenue)}</span>
                    <span>{totalBookings} prestation{totalBookings > 1 ? 's' : ''}</span>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-sm sm:text-base">Évolution clients</h3>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground text-base sm:text-lg">{currentClients} client{currentClients > 1 ? 's' : ''}</span>
                    {newClients > 0 && <span className="text-emerald-600 dark:text-emerald-400">+{newClients} nouveau{newClients > 1 ? 'x' : ''}</span>}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          {/* Metric dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer"
            >
              {metricLabels[metric]}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg z-10 overflow-hidden min-w-25"
                >
                  {(['revenue', 'clients'] as Metric[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMetric(m);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs sm:text-sm transition-colors cursor-pointer ${
                        metric === m
                          ? 'bg-muted/50 font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                      }`}
                    >
                      {metricLabels[m]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Period switcher */}
          <div className="flex bg-muted/50 rounded-lg p-1 w-fit">
            {(['week', 'month', '6months'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  period === p
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${metric}-${period}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-40 sm:h-48">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
          ) : isEmpty ? (
            <div className="flex items-center justify-center h-40 sm:h-48 text-muted-foreground text-sm">
              {metric === 'revenue'
                ? 'Aucune prestation terminée sur cette période'
                : 'Aucun nouveau client sur cette période'}
            </div>
          ) : (
            <div className="h-40 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    interval={period === 'month' ? 4 : period === '6months' ? 2 : 0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={
                      metric === 'revenue'
                        ? (v) => (v === 0 ? '0' : `${(v / 100).toFixed(0)}€`)
                        : (v) => String(Math.floor(v))
                    }
                    allowDecimals={false}
                  />
                  <Tooltip content={metric === 'revenue' ? <RevenueTooltip /> : <ClientsTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    activeDot={{ r: 5, fill: chartColor, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
