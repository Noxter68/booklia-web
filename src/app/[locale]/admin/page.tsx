'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Building2,
  CheckCircle,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageLoader } from '@/components/ui/spinner';

export default function AdminDashboardPage() {
  // Fetch stats
  const { data: businessesData, isLoading } = useQuery({
    queryKey: ['admin-businesses'],
    queryFn: () => api.adminListBusinesses(1, 100),
  });

  // Calculate stats
  const totalBusinesses = businessesData?.meta.total || 0;
  const verifiedBusinesses = businessesData?.data.filter((b) => b.isVerified).length || 0;
  const activeBusinesses = businessesData?.data.filter((b) => b.isActive).length || 0;
  const recentBusinesses = businessesData?.data.slice(0, 5) || [];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de la plateforme</p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <PageLoader text="Chargement des statistiques..." />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Total
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalBusinesses}</p>
              <p className="text-sm text-gray-500 mt-1">Business</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Verifies
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{verifiedBusinesses}</p>
              <p className="text-sm text-gray-500 mt-1">Business verifies</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Actifs
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{activeBusinesses}</p>
              <p className="text-sm text-gray-500 mt-1">Business actifs</p>
            </motion.div>
          </div>

          {/* Recent Businesses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Derniers business</h2>
              </div>
              <Link
                href="/admin/businesses"
                className="text-sm text-primary hover:underline"
              >
                Voir tout
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentBusinesses.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  Aucun business pour le moment
                </div>
              ) : (
                recentBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                      {business.logoUrl ? (
                        <img
                          src={business.logoUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {business.name}
                        </p>
                        {business.isVerified && (
                          <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {business.city || 'Ville non renseignee'}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        business.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {business.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
