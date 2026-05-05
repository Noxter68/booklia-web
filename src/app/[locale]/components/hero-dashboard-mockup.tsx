'use client';

import { motion } from 'framer-motion';
import { Globe, Scissors, Users, Calendar, Home, TrendingUp, Heart } from 'lucide-react';

// ── SVG area chart ────────────────────────────────────────────────────────────
function MiniAreaChart({ color, gradId }: { color: string; gradId: string }) {
  const pts = [
    [0,90],[60,88],[120,85],[180,80],[220,78],
    [260,40],[300,38],[340,22],[380,20],[420,18],[460,6],[500,4],
  ] as [number, number][];
  const pathD = pts.map(([x,y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaD = `${pathD} L500,96 L0,96 Z`;
  return (
    <svg viewBox="0 0 500 96" className="w-full h-20" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <motion.path d={areaD} fill={`url(#${gradId})`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      <motion.path d={pathD} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }} />
    </svg>
  );
}

// ── KPI cards ─────────────────────────────────────────────────────────────────
const KPI_CARDS = [
  { icon: <Scissors className="w-5 h-5 text-rose-600" />,   value: '22',    label: 'Services',      iconBg: 'bg-rose-100' },
  { icon: <Users    className="w-5 h-5 text-blue-600" />,   value: '3',     label: 'Employés',      iconBg: 'bg-blue-100' },
  { icon: <Calendar className="w-5 h-5 text-green-600" />,  value: '12',    label: 'Réservations',  iconBg: 'bg-green-100' },
  { icon: <Home     className="w-5 h-5 text-purple-600" />, value: '519 €', label: 'CA (semaine)',   iconBg: 'bg-purple-100' },
];

const BOOKINGS = [
  { client: 'David P.',  service: 'Effet mascara',      time: '09:00', price: '50 €', status: 'Terminée',  statusColor: 'text-emerald-600' },
  { client: 'Karine M.', service: 'Rehaussement cils',  time: '10:30', price: '40 €', status: 'Confirmée', statusColor: 'text-blue-600' },
];

// ── Main component ─────────────────────────────────────────────────────────────
export function HeroDashboardMockup() {
  return (
    <div className="relative pb-20 select-none">
      {/* Glow */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-rose-300/20 blur-3xl rounded-full pointer-events-none" />

      {/* Floating card — satisfaction (haut droite) */}
      <motion.div
        initial={{ opacity: 0, x: 30, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0, ease: 'easeOut' }}
        style={{ rotate: 7 }}
        className="absolute right-6 -top-6 z-10 bg-white rounded-2xl shadow-xl shadow-black/10 border border-black/8 p-3 hidden sm:block"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-xs font-semibold text-gray-800">Sophie M.</p>
        </div>
        <div className="flex items-center gap-0.5">
          {[1,2,3,4,5].map(i => (
            <svg key={i} className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
          <span className="text-[10px] font-bold text-gray-700 ml-1">4.9</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">&ldquo;Service impeccable !&rdquo;</p>
      </motion.div>

      {/* macOS window */}
      <div className="rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.18)] border border-black/10 bg-white">

        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#f5f5f7] border-b border-black/8">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57] shrink-0" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e] shrink-0" />
          <span className="w-3 h-3 rounded-full bg-[#28c840] shrink-0" />
          <div className="flex-1 flex items-center gap-1.5 bg-white/80 border border-black/10 rounded-md px-2.5 py-1 mx-4 shadow-sm">
            <Globe className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-[11px] text-gray-500 font-medium flex-1 text-center">booklia.org</span>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="bg-[#f8f8fa] p-3 sm:p-4 space-y-3">

          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {KPI_CARDS.map((kpi, i) => (
              <motion.div key={kpi.label}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.07 }}
                className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-sm"
              >
                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${kpi.iconBg} flex items-center justify-center shrink-0`}>
                  {kpi.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-bold text-gray-900 leading-none">{kpi.value}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">{kpi.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Revenue chart */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.75 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-sm text-blue-600 font-bold shrink-0">€</div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900">Chiffre d&apos;affaires</p>
                  <p className="text-[10px] sm:text-xs text-gray-400">519,00 € · 10 prestations</p>
                </div>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
                {['7j', '30j', '6m'].map((l, i) => (
                  <span key={l} className={`text-[10px] px-2 sm:px-2.5 py-1 rounded-md font-medium ${i === 1 ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}>{l}</span>
                ))}
              </div>
            </div>
            <MiniAreaChart color="#4f7df9" gradId="heroChartGrad1" />
            <div className="hidden sm:flex justify-between text-[9px] text-gray-300 mt-1">
              {['6 avr.','11 avr.','16 avr.','21 avr.','26 avr.','1 mai'].map(l => <span key={l}>{l}</span>)}
            </div>
          </motion.div>

          {/* Bookings table */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.85 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-gray-100">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs font-bold text-gray-900">Réservations</span>
              <span className="hidden sm:inline text-xs text-gray-400">4 Mai – 10 Mai 2026</span>
              <div className="ml-auto flex bg-gray-100 rounded-lg p-0.5 shrink-0">
                {['Semaine', 'Mois'].map((l, i) => (
                  <span key={l} className={`text-[10px] px-2 py-1 rounded-md font-medium ${i === 0 ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}>{l}</span>
                ))}
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-[1fr_2fr_1fr_1fr] px-4 py-1.5 border-b border-gray-50 text-[9px] font-semibold text-gray-300 uppercase tracking-wider">
                <span>Client</span><span>Prestation</span><span>Heure</span><span>Statut</span>
              </div>
              {BOOKINGS.map((row, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 + i * 0.08 }}
                  className="grid grid-cols-[1fr_2fr_1fr_1fr] px-4 py-2.5 items-center text-xs text-gray-700 border-b border-gray-50 last:border-0"
                >
                  <span className="font-medium truncate">{row.client}</span>
                  <span className="text-gray-500 truncate">{row.service}</span>
                  <span className="flex items-center gap-1">
                    <span className="bg-gray-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">{row.time}</span>
                  </span>
                  <span className={`font-semibold ${row.statusColor}`}>{row.status}</span>
                </motion.div>
              ))}
            </div>

            {/* Mobile — cards simples */}
            <div className="sm:hidden divide-y divide-gray-50">
              {BOOKINGS.map((row, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 + i * 0.08 }}
                  className="flex items-center justify-between px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{row.client}</p>
                    <p className="text-[10px] text-gray-400 truncate">{row.service}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="bg-gray-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">{row.time}</span>
                    <span className={`text-[10px] font-semibold ${row.statusColor}`}>{row.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
