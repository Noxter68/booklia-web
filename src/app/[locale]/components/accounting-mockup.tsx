'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, TrendingUp, TrendingDown, Landmark, Wallet } from 'lucide-react';

// ── Bar chart ─────────────────────────────────────────────────────────────────
function MiniBarChart() {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'];
  const rev    = [3200, 4100, 3800, 5200, 5190];
  const exp    = [1200, 980,  1400, 1100, 890];
  const max    = Math.max(...rev, ...exp);

  return (
    <div className="flex gap-2 w-full h-full">
      {months.map((m, i) => (
        <div key={m} className="flex-1 flex flex-col gap-1 h-full">
          <div className="flex-1 w-full flex gap-0.5 items-end">
            <div className="flex-1 flex items-end h-full">
              <motion.div className="w-full rounded-t-sm bg-pink-400"
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: 'easeOut' }}
                style={{ height: `${(rev[i] / max) * 100}%`, transformOrigin: 'bottom' }}
              />
            </div>
            <div className="flex-1 flex items-end h-full">
              <motion.div className="w-full rounded-t-sm bg-amber-400"
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: 'easeOut' }}
                style={{ height: `${(exp[i] / max) * 100}%`, transformOrigin: 'bottom' }}
              />
            </div>
          </div>
          <span className="text-[8px] text-gray-400 shrink-0 text-center">{m}</span>
        </div>
      ))}
    </div>
  );
}

// ── KPI data ──────────────────────────────────────────────────────────────────
const KPI_MONTH = [
  { icon: <TrendingUp  className="w-4 h-4 text-pink-600" />,    label: 'CA brut',        value: '1 240 €',  sub: '8 prestations terminées',    bg: 'bg-pink-50',    iconBg: 'bg-pink-100',    border: 'border-pink-100' },
  { icon: <TrendingDown className="w-4 h-4 text-amber-600" />,  label: 'Charges',        value: '312 €',    sub: '4 dépenses',                  bg: 'bg-amber-50',   iconBg: 'bg-amber-100',   border: 'border-amber-100' },
  { icon: <Landmark    className="w-4 h-4 text-blue-600" />,    label: 'À provisionner', value: '263 €',    sub: 'URSSAF 21.2%',                bg: 'bg-blue-50',    iconBg: 'bg-blue-100',    border: 'border-blue-100' },
  { icon: <Wallet      className="w-4 h-4 text-emerald-600" />, label: 'Net estimé',     value: '665 €',    sub: 'Après charges & provisions',  bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', border: 'border-emerald-100' },
];
const KPI_YEAR = [
  { icon: <TrendingUp  className="w-4 h-4 text-pink-600" />,    label: 'CA brut',        value: '14 820 €', sub: '96 prestations terminées',    bg: 'bg-pink-50',    iconBg: 'bg-pink-100',    border: 'border-pink-100' },
  { icon: <TrendingDown className="w-4 h-4 text-amber-600" />,  label: 'Charges',        value: '3 740 €',  sub: '32 dépenses',                 bg: 'bg-amber-50',   iconBg: 'bg-amber-100',   border: 'border-amber-100' },
  { icon: <Landmark    className="w-4 h-4 text-blue-600" />,    label: 'À provisionner', value: '3 142 €',  sub: 'URSSAF 21.2%',                bg: 'bg-blue-50',    iconBg: 'bg-blue-100',    border: 'border-blue-100' },
  { icon: <Wallet      className="w-4 h-4 text-emerald-600" />, label: 'Net estimé',     value: '7 938 €',  sub: 'Après charges & provisions',  bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', border: 'border-emerald-100' },
];

const EXPENSES = [
  { cat: 'URSSAF',    label: 'Cotisations sociales',  amount: '263 €', catColor: 'bg-blue-100 text-blue-700 border-blue-200' },
  { cat: 'Logiciel',  label: 'Abonnement Booklia',    amount: '29 €',  catColor: 'bg-sky-100 text-sky-700 border-sky-200' },
  { cat: 'Matériel',  label: 'Vernis UV professionnel', amount: '12 €', catColor: 'bg-amber-100 text-amber-700 border-amber-200' },
  { cat: 'Assurance', label: 'RC Professionnelle',    amount: '8 €',   catColor: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
];

// ── Main component ─────────────────────────────────────────────────────────────
export function AccountingMockup() {
  const [activePeriod, setActivePeriod] = useState<'month' | 'year'>('month');
  const kpis = activePeriod === 'month' ? KPI_MONTH : KPI_YEAR;

  return (
    <div className="relative select-none">
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-emerald-300/20 blur-3xl rounded-full pointer-events-none" />

      <div className="rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.15)] border border-black/10 bg-white">

        {/* macOS title bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#f5f5f7] border-b border-black/8">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57] shrink-0" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e] shrink-0" />
          <span className="w-3 h-3 rounded-full bg-[#28c840] shrink-0" />
          <div className="flex-1 flex items-center gap-1.5 bg-white/80 border border-black/10 rounded-md px-2.5 py-1 mx-4 shadow-sm">
            <Globe className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-[11px] text-gray-500 font-medium flex-1 text-center">booklia.org</span>
          </div>
        </div>

        <div className="bg-[#f8f8fa] p-4 sm:p-5 space-y-4">

          {/* Header + period toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Comptabilité</p>
              <p className="text-xs text-gray-400">{activePeriod === 'month' ? 'Mai 2026' : 'Année 2026'}</p>
            </div>
            <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
              {(['month', 'year'] as const).map((p) => (
                <button key={p} onClick={() => setActivePeriod(p)}
                  className={`text-[10px] px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                    activePeriod === p ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {p === 'month' ? 'Mois' : 'Année'}
                </button>
              ))}
            </div>
          </div>

          {/* KPI cards */}
          <AnimatePresence mode="wait">
            <motion.div key={activePeriod}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {kpis.map((kpi, i) => (
                <motion.div key={kpi.label}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.07 }}
                  className={`${kpi.bg} ${kpi.border} border rounded-xl p-3 sm:p-3.5`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">{kpi.label}</span>
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${kpi.iconBg} flex items-center justify-center`}>{kpi.icon}</div>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 hidden sm:block">{kpi.sub}</p>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Chart + expense list */}
          <div className="grid sm:grid-cols-[1.5fr_1fr] gap-4">
            {/* Bar chart */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-900">CA vs Charges</p>
                <div className="flex items-center gap-3 text-[9px] text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-pink-400 inline-block" /> CA</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Charges</span>
                </div>
              </div>
              <div className="flex-1 min-h-0" style={{ minHeight: 80 }}>
                <MiniBarChart />
              </div>
            </div>

            {/* Expense list */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-900">Détail des charges</p>
                <span className="text-[10px] text-gray-400">312 €</span>
              </div>
              <div className="divide-y divide-gray-50">
                {EXPENSES.map((e, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-4 py-2.5">
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${e.catColor} whitespace-nowrap shrink-0`}>{e.cat}</span>
                    <span className="text-[11px] text-gray-500 flex-1 truncate">{e.label}</span>
                    <span className="text-[11px] font-semibold text-gray-900 shrink-0">{e.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
