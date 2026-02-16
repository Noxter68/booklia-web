'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  MapPin,
  Calendar,
  Star,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageLoader } from '@/components/ui/spinner';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.adminListUsers(1, 100),
  });

  // Filter users
  const filteredUsers = usersData?.data.filter((u) =>
    search
      ? u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.profile?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        u.profile?.city?.toLowerCase().includes(search.toLowerCase())
      : true
  ) || [];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Particuliers</h1>
        <p className="text-gray-500 mt-1">
          {usersData?.meta.total || 0} particuliers inscrits
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </motion.div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <PageLoader text="Chargement..." />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {search ? 'Aucun particulier trouve' : 'Aucun particulier pour le moment'}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">
                    Utilisateur
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 hidden lg:table-cell">
                    Localisation
                  </th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600 hidden sm:table-cell">
                    Reputation
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 hidden lg:table-cell">
                    Inscription
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                          {user.profile?.avatarUrl ? (
                            <img
                              src={user.profile.avatarUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-500">
                              {user.name?.[0]?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {user.profile?.displayName || user.name || 'Sans nom'}
                          </p>
                          <p className="text-sm text-gray-500 truncate md:hidden">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-gray-600 truncate">{user.email}</p>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-gray-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-sm">
                          {user.profile?.city || 'Non renseigne'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="text-gray-900 font-medium">
                          {user.reputation?.ratingAvg5?.toFixed(1) || '-'}
                        </span>
                        <span className="text-gray-400 text-sm">
                          ({user.reputation?.ratingCount || 0})
                        </span>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-sm">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end">
                        <Link
                          href={`/profile/${user.id}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                          title="Voir le profil"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
