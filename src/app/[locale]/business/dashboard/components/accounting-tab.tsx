'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Plus,
  Trash2,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  Landmark,
  Wallet,
  Tag,
  FileText,
  Hash,
  RotateCcw,
  Settings,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePickerPopover } from '@/components/ui/date-picker-popover';
import { useToast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import { MaskedAmount, useAmountsVisibility } from '@/contexts/amounts-visibility-context';
import type { ExpenseCategory, ExpenseItem, AccountingSummary } from '@/types';
import { BillingSettingsTab } from './billing-settings-tab';

const categoryLabels: Record<ExpenseCategory, string> = {
  URSSAF: 'URSSAF',
  RENT: 'Loyer salon',
  MATERIAL: 'Matériel',
  SUPPLIER_ORDER: 'Commande fournisseur',
  INSURANCE: 'Assurance',
  SOFTWARE: 'Logiciel',
  MARKETING: 'Marketing',
  OTHER: 'Autre',
};

const categoryColors: Record<ExpenseCategory, string> = {
  URSSAF: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/40',
  RENT: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/40',
  MATERIAL: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/40',
  SUPPLIER_ORDER: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/40',
  INSURANCE: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/40',
  SOFTWARE: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-900/40',
  MARKETING: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-900/40',
  OTHER: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700',
};

/** Small rounded chip — sized to its content, with a subtle colored border. */
function CategoryChip({ category }: { category: ExpenseCategory }) {
  return (
    <span
      className={`inline-flex items-center w-fit rounded-md border px-2 py-0.5 text-xs font-medium ${categoryColors[category]}`}
    >
      {categoryLabels[category]}
    </span>
  );
}

type PeriodMode = 'month' | 'year';

const STORAGE_KEY = 'booklia.accounting.period';

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function currentYearValue(): string {
  return String(new Date().getFullYear());
}

/** Long month names for the active locale (Janvier / January / Janeiro). */
function getMonthNames(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'long' });
  return Array.from({ length: 12 }, (_, i) =>
    capitalize(fmt.format(new Date(2000, i, 1))),
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatPeriodLabel(
  period: PeriodMode,
  value: string,
  monthNames: string[],
): string {
  if (period === 'year') return value;
  const [year, month] = value.split('-').map(Number);
  return `${monthNames[month - 1]} ${year}`;
}

function formatExpenseDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface PersistedPeriod {
  period: PeriodMode;
  monthValue: string;
  yearValue: string;
}

function loadPersistedPeriod(): PersistedPeriod | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      (parsed.period === 'month' || parsed.period === 'year') &&
      typeof parsed.monthValue === 'string' &&
      typeof parsed.yearValue === 'string'
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

function persistPeriod(p: PersistedPeriod) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function clearPersistedPeriod() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

type AccountingView = 'overview' | 'settings';

export function AccountingTab() {
  const locale = useLocale();
  const monthNames = useMemo(() => getMonthNames(locale), [locale]);

  const todayMonth = currentMonthValue();
  const todayYear = currentYearValue();

  // Lazy-init state from localStorage. Safe because this component is
  // mounted only on the client (dynamic({ ssr: false }) in dashboard/page.tsx).
  const persisted = useMemo(() => loadPersistedPeriod(), []);

  const [view, setView] = useState<AccountingView>('overview');
  const [period, setPeriodState] = useState<PeriodMode>(
    persisted?.period ?? 'month',
  );
  const [monthValue, setMonthValueState] = useState(
    persisted?.monthValue ?? todayMonth,
  );
  const [yearValue, setYearValueState] = useState(
    persisted?.yearValue ?? todayYear,
  );
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Persist any change to localStorage. Initial state was already lazy-loaded
  // from storage above, so no separate hydration effect is needed.
  useEffect(() => {
    persistPeriod({ period, monthValue, yearValue });
  }, [period, monthValue, yearValue]);

  const setPeriod = (p: PeriodMode) => setPeriodState(p);
  const setMonthValue = (v: string) => setMonthValueState(v);
  const setYearValue = (v: string) => setYearValueState(v);

  const value = period === 'month' ? monthValue : yearValue;
  const isOnCurrentPeriod =
    period === 'month' ? monthValue === todayMonth : yearValue === todayYear;

  const handleReset = () => {
    setPeriodState('month');
    setMonthValueState(todayMonth);
    setYearValueState(todayYear);
    clearPersistedPeriod();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['accounting-summary', period, value],
    queryFn: () => api.getAccountingSummary({ period, value }),
    enabled: view === 'overview',
  });

  if (view === 'settings') {
    return (
      <div>
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => setView('overview')}
            className="rounded-full"
          >
            ← Retour à la comptabilité
          </Button>
        </div>
        <BillingSettingsTab />
      </div>
    );
  }

  const periodSelector = (
    <PeriodSelector
      period={period}
      monthValue={monthValue}
      yearValue={yearValue}
      monthNames={monthNames}
      showReset={!isOnCurrentPeriod}
      onPeriodChange={setPeriod}
      onMonthChange={setMonthValue}
      onYearChange={setYearValue}
      onReset={handleReset}
    />
  );

  return (
    <div>
      {/* Header — title left, action buttons right; toggles always on a second row.
            Mobile: title / buttons grid 2 cols / toggles
            Desktop: title <—> buttons inline / toggles */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Comptabilité</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data ? formatPeriodLabel(period, value, monthNames) : '...'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button
              variant="outline"
              onClick={() => setView('settings')}
              className="rounded-full whitespace-nowrap w-full sm:w-auto"
            >
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
            <Button
              onClick={() => setShowAddExpense(true)}
              className="rounded-full whitespace-nowrap w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une charge
            </Button>
          </div>
        </div>

        {periodSelector}
      </div>

      {isLoading || !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <>
          <KpiCards data={data} />

          <div className="grid gap-6 lg:grid-cols-3 mt-6">
            <div className="lg:col-span-2">
              <RevenueVsExpensesChart data={data} period={period} monthNames={monthNames} />
            </div>
            <ExpensesByCategoryCard data={data} />
          </div>

          <ExpensesTable items={data.expenses.items} locale={locale} />

          {data.settings?.legalForm?.startsWith('AUTOENTREPRENEUR') && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Charges affichées pour ton suivi de trésorerie — non déductibles fiscalement en régime micro.
            </p>
          )}
        </>
      )}

      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        locale={locale}
      />
    </div>
  );
}

// ============================================
// Period selector — left-aligned, mobile-first.
//
// Layout:
//   - mobile: segmented Mois/Année (full width), then dropdowns on a new line
//   - desktop: everything inline
// ============================================
function PeriodSelector({
  period,
  monthValue,
  yearValue,
  monthNames,
  showReset,
  onPeriodChange,
  onMonthChange,
  onYearChange,
  onReset,
}: {
  period: PeriodMode;
  monthValue: string;
  yearValue: string;
  monthNames: string[];
  showReset: boolean;
  onPeriodChange: (p: PeriodMode) => void;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
  onReset: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));
  const [selectedYear, selectedMonth] = monthValue.split('-');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      {/* Segmented Mois / Année */}
      <div className="flex bg-muted/50 rounded-lg p-1 w-full sm:w-auto">
        {(['month', 'year'] as PeriodMode[]).map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              period === p
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p === 'month' ? 'Mois' : 'Année'}
          </button>
        ))}
      </div>

      {/* Dropdowns */}
      {period === 'month' ? (
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(`${selectedYear}-${e.target.value}`)}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {monthNames.map((m, idx) => (
              <option key={m} value={String(idx + 1).padStart(2, '0')}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => onMonthChange(`${e.target.value}-${selectedMonth}`)}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      ) : (
        <select
          value={yearValue}
          onChange={(e) => onYearChange(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      )}

      {/* Reset — only when off the current period */}
      {showReset && (
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer w-full sm:w-auto"
          title="Revenir au mois courant"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Aujourd&apos;hui
        </button>
      )}
    </div>
  );
}

// ============================================
// KPI Cards
// ============================================
function KpiCards({ data }: { data: AccountingSummary }) {
  const bookingCount = data.revenue.bookingCount;
  const invoicedCents = data.revenue.invoicedCents;
  const grossCents = data.revenue.grossCents;
  const invoicedPct =
    grossCents > 0 ? Math.min(100, Math.round((invoicedCents / grossCents) * 100)) : 0;

  const cards: Array<{
    label: string;
    value: number;
    sub: string;
    extra?: React.ReactNode;
    icon: typeof TrendingUp;
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
  }> = [
    {
      label: 'CA brut',
      value: grossCents,
      sub: `${bookingCount} prestation${bookingCount > 1 ? 's' : ''} terminée${bookingCount > 1 ? 's' : ''}`,
      extra: bookingCount > 0 && (
        <p className="text-xs text-pink-700/80 dark:text-pink-400/80 mt-1">
          <MaskedAmount value={formatPrice(invoicedCents)} /> facturés ({invoicedPct}%)
        </p>
      ),
      icon: TrendingUp,
      bg: 'bg-pink-50 dark:bg-pink-950/30',
      border: 'border-pink-200 dark:border-pink-900/50',
      iconBg: 'bg-pink-100 dark:bg-pink-900/50',
      iconColor: 'text-pink-600 dark:text-pink-400',
    },
    {
      label: 'Charges',
      value: data.expenses.totalCents,
      sub: `${data.expenses.count} dépense${data.expenses.count > 1 ? 's' : ''}`,
      icon: TrendingDown,
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-900/50',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'À provisionner',
      value: data.provisions.urssafCents + data.provisions.incomeTaxCents,
      sub: data.settings?.urssafRate
        ? `URSSAF ${(data.settings.urssafRate * 100).toFixed(1)}%`
        : 'Configurer dans les réglages',
      icon: Landmark,
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-900/50',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Net estimé',
      value: data.netEstimateCents,
      sub: 'Après charges & provisions',
      icon: Wallet,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-900/50',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`${c.bg} ${c.border} border rounded-2xl p-5`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
              <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              <MaskedAmount value={formatPrice(c.value)} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
            {c.extra}
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================
// Revenue vs Expenses chart
// ============================================
function RevenueVsExpensesChart({
  data,
  period,
  monthNames,
}: {
  data: AccountingSummary;
  period: PeriodMode;
  monthNames: string[];
}) {
  const { visible } = useAmountsVisibility();

  const chartData = useMemo(() => {
    // Build a unified set of period keys (months) covering both series
    const keys = new Set<string>();
    data.revenue.monthlyBreakdown.forEach((b) => keys.add(b.month));
    data.expenses.monthlyBreakdown.forEach((b) => keys.add(b.month));
    const sorted = Array.from(keys).sort();

    const revMap = new Map(data.revenue.monthlyBreakdown.map((b) => [b.month, b.cents]));
    const expMap = new Map(data.expenses.monthlyBreakdown.map((b) => [b.month, b.cents]));

    return sorted.map((month) => {
      const [y, m] = month.split('-').map(Number);
      const label = period === 'year'
        ? monthNames[m - 1].slice(0, 3)
        : `${monthNames[m - 1].slice(0, 3)} ${String(y).slice(2)}`;
      return {
        label,
        revenue: (revMap.get(month) ?? 0) / 100,
        expenses: (expMap.get(month) ?? 0) / 100,
      };
    });
  }, [data, period, monthNames]);

  const isEmpty = chartData.length === 0;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h3 className="font-semibold mb-4">CA vs Charges</h3>
      {isEmpty ? (
        <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
          Aucune donnée sur la période
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => (!visible ? '•••' : v === 0 ? '0' : `${v.toFixed(0)}€`)}
              />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-surface border border-border rounded-xl px-3 py-2 shadow-lg text-sm">
                      <p className="font-medium mb-1">{label}</p>
                      {payload.map((p: any) => (
                        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
                          {p.dataKey === 'revenue' ? 'CA' : 'Charges'}: {visible ? `${p.value.toFixed(2)} €` : '•••'}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="CA" fill="#ec4899" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Charges" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ============================================
// Expenses by category breakdown
// ============================================
function ExpensesByCategoryCard({ data }: { data: AccountingSummary }) {
  if (data.expenses.byCategory.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5">
        <h3 className="font-semibold mb-4">Par catégorie</h3>
        <p className="text-sm text-muted-foreground">Aucune charge sur la période</p>
      </div>
    );
  }

  const total = data.expenses.totalCents;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h3 className="font-semibold mb-4">Par catégorie</h3>
      <div className="space-y-3">
        {data.expenses.byCategory.map((c) => {
          const pct = total > 0 ? (c.cents / total) * 100 : 0;
          return (
            <div key={c.category}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">{categoryLabels[c.category]}</span>
                <span className="font-medium"><MaskedAmount value={formatPrice(c.cents)} /></span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Expenses table
// ============================================
function ExpensesTable({
  items,
  locale,
}: {
  items: ExpenseItem[];
  locale: string;
}) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteExpense(id),
    onSuccess: () => {
      success('Charge supprimée');
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] });
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  if (items.length === 0) {
    return (
      <div className="mt-6 bg-surface border border-border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Aucune charge sur cette période</p>
        <p className="text-sm text-muted-foreground mt-1">
          Clique sur « Ajouter une charge » pour commencer
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold">Détail des charges</h3>
      </div>

      {/* Desktop header */}
      <div className="hidden md:grid md:grid-cols-[110px_140px_1fr_140px_120px_40px] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span>Date</span>
        <span>Catégorie</span>
        <span>Description</span>
        <span>Référence</span>
        <span className="text-right">Montant</span>
        <span />
      </div>

      <div>
        {items.map((e, idx) => (
          <div
            key={e.id}
            className={`px-5 py-3 ${idx < items.length - 1 ? 'border-b border-border' : ''}`}
          >
            {/* Mobile */}
            <div className="md:hidden flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CategoryChip category={e.category} />
                  <span className="text-xs text-muted-foreground">{formatExpenseDate(e.date, locale)}</span>
                </div>
                <p className="text-sm truncate">{e.description}</p>
                {e.reference && <p className="text-xs text-muted-foreground mt-0.5">Réf : {e.reference}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm">
                  <MaskedAmount value={formatPrice(e.amountCents)} />
                </p>
                <button
                  onClick={() => deleteMutation.mutate(e.id)}
                  disabled={deleteMutation.isPending}
                  className="text-muted-foreground hover:text-red-600 mt-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden md:grid md:grid-cols-[110px_140px_1fr_140px_120px_40px] gap-4 items-center">
              <span className="text-sm text-muted-foreground">{formatExpenseDate(e.date, locale)}</span>
              <CategoryChip category={e.category} />
              <span className="text-sm truncate">{e.description}</span>
              <span className="text-sm text-muted-foreground truncate">{e.reference || '—'}</span>
              <span className="text-sm font-semibold text-right">
                <MaskedAmount value={formatPrice(e.amountCents)} />
              </span>
              <button
                onClick={() => deleteMutation.mutate(e.id)}
                disabled={deleteMutation.isPending}
                className="text-muted-foreground hover:text-red-600 cursor-pointer flex justify-end"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Add expense modal
// ============================================
function AddExpenseModal({
  isOpen,
  onClose,
  locale,
}: {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}) {
  if (!isOpen) return null;
  // Mounting AddExpenseForm only when open guarantees a fresh form state on each open.
  return <AddExpenseForm onClose={onClose} locale={locale} />;
}

function AddExpenseForm({
  onClose,
  locale,
}: {
  onClose: () => void;
  locale: string;
}) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<{
    date: string;
    category: ExpenseCategory;
    description: string;
    amount: string; // user-typed, e.g. "12.50"
    reference: string;
  }>({
    date: today,
    category: 'MATERIAL',
    description: '',
    amount: '',
    reference: '',
  });

  const mutation = useMutation({
    mutationFn: () => {
      const amountCents = Math.round(parseFloat(form.amount.replace(',', '.')) * 100);
      return api.createExpense({
        date: new Date(form.date).toISOString(),
        category: form.category,
        description: form.description.trim(),
        amountCents,
        reference: form.reference.trim() || undefined,
      });
    },
    onSuccess: () => {
      success('Charge ajoutée');
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] });
      onClose();
    },
    onError: (err: any) => showError(err.message || 'Erreur lors de l\'ajout'),
  });

  const amountNumber = parseFloat(form.amount.replace(',', '.'));
  const canSubmit =
    form.description.trim().length > 0 &&
    !isNaN(amountNumber) &&
    amountNumber > 0 &&
    !!form.date;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-bold">Nouvelle charge</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <DatePickerPopover
              value={form.date}
              onChange={(d) => setForm((f) => ({ ...f, date: d }))}
              locale={locale}
              maxDate={new Date(today)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {(Object.keys(categoryLabels) as ExpenseCategory[]).map((cat) => (
                  <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Ex : Shampoing professionnel"
                maxLength={255}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Montant TTC <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              <Input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0,00"
                className="rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Référence</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                placeholder="N° de facture fournisseur (optionnel)"
                maxLength={100}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!canSubmit || mutation.isPending}
            className="w-full rounded-xl"
          >
            Ajouter la charge
          </Button>
        </div>
      </div>
    </div>
  );
}
