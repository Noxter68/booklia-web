'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  CheckCircle,
  Search,
  X,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { AddressAutocomplete, AddressResult } from '@/components/ui/address-autocomplete';

export default function AdminBusinessesPage() {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [isEarlyAdopter, setIsEarlyAdopter] = useState(false);

  // Fetch businesses
  const { data: businessesData, isLoading } = useQuery({
    queryKey: ['admin-businesses'],
    queryFn: () => api.adminListBusinesses(1, 100),
  });

  // Filter businesses
  const filteredBusinesses = businessesData?.data.filter((b) =>
    search
      ? b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.city?.toLowerCase().includes(search.toLowerCase()) ||
        b.owner?.email?.toLowerCase().includes(search.toLowerCase())
      : true
  ) || [];

  // Mutations
  const createBusinessMutation = useMutation({
    mutationFn: (data: {
      businessName: string;
      ownerEmail: string;
      ownerFirstName: string;
      ownerLastName: string;
      phone?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      latitude?: number;
      longitude?: number;
      isEarlyAdopter?: boolean;
    }) => api.adminCreateBusiness(data),
    onSuccess: (result) => {
      success('Business cree avec succes');
      setGeneratedPassword(result.generatedPassword);
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
      resetForm();
    },
    onError: (err: Error) => showError(err.message || 'Erreur lors de la creation'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => api.adminResetBusinessPassword(id),
    onSuccess: (result) => {
      success(`Mot de passe reinitialise`);
      setGeneratedPassword(result.generatedPassword);
      setShowPassword(false);
    },
    onError: () => showError('Erreur lors de la reinitialisation'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => api.adminToggleBusinessActive(id),
    onSuccess: () => {
      success('Statut mis a jour');
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
    },
    onError: () => showError('Erreur lors de la mise a jour'),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => api.adminVerifyBusiness(id),
    onSuccess: () => {
      success('Business verifie');
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
    },
    onError: () => showError('Erreur lors de la verification'),
  });

  const toggleEarlyAdopterMutation = useMutation({
    mutationFn: (id: string) => api.adminToggleEarlyAdopter(id),
    onSuccess: () => {
      success('Statut Early Adopter mis a jour');
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
    },
    onError: () => showError('Erreur lors de la mise a jour'),
  });

  const resetForm = () => {
    setBusinessName('');
    setOwnerEmail('');
    setOwnerFirstName('');
    setOwnerLastName('');
    setPhone('');
    setAddress('');
    setCity('');
    setPostalCode('');
    setLatitude(undefined);
    setLongitude(undefined);
    setIsEarlyAdopter(false);
  };

  const handleCreateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !ownerEmail || !ownerFirstName || !ownerLastName) {
      showError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    createBusinessMutation.mutate({
      businessName,
      ownerEmail,
      ownerFirstName,
      ownerLastName,
      phone: phone || undefined,
      address: address || undefined,
      city: city || undefined,
      postalCode: postalCode || undefined,
      latitude,
      longitude,
      isEarlyAdopter: isEarlyAdopter || undefined,
    });
  };

  const handleAddressSelect = (result: AddressResult) => {
    setAddress(result.label);
    setCity(result.city);
    setPostalCode(result.postalCode);
    setLatitude(result.latitude);
    setLongitude(result.longitude);
  };

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Business</h1>
          <p className="text-gray-500 mt-1">
            {businessesData?.meta.total || 0} business au total
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="rounded-xl bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau business
        </Button>
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
            placeholder="Rechercher par nom, ville, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </motion.div>

      {/* Password Display */}
      <AnimatePresence>
        {generatedPassword && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-green-700">
                Mot de passe genere :
              </p>
              <button
                onClick={() => setGeneratedPassword(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-900">
                {showPassword ? generatedPassword : '••••••••••••'}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPassword}
                className="text-gray-500 hover:text-gray-700"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Business List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <PageLoader text="Chargement..." />
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {search ? 'Aucun business trouve' : 'Aucun business pour le moment'}
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
                    Business
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 hidden md:table-cell">
                    Proprietaire
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 hidden lg:table-cell">
                    Contact
                  </th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600">
                    Statut
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBusinesses.map((business) => (
                  <tr
                    key={business.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
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
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">
                              {business.name}
                            </p>
                            {business.isVerified && (
                              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {business.city || 'Non renseigne'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-gray-900 truncate">{business.owner?.name || '-'}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {business.owner?.email}
                      </p>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="space-y-1">
                        {business.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {business.phone}
                          </p>
                        )}
                        {business.email && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {business.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            business.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {business.isActive ? 'Actif' : 'Inactif'}
                        </span>
                        {business.isEarlyAdopter && (
                          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Early
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => resetPasswordMutation.mutate(business.id)}
                          disabled={resetPasswordMutation.isPending}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Reset mot de passe"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActiveMutation.mutate(business.id)}
                          disabled={toggleActiveMutation.isPending}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title={business.isActive ? 'Desactiver' : 'Activer'}
                        >
                          {business.isActive ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        {!business.isVerified && (
                          <button
                            onClick={() => verifyMutation.mutate(business.id)}
                            disabled={verifyMutation.isPending}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Verifier"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleEarlyAdopterMutation.mutate(business.id)}
                          disabled={toggleEarlyAdopterMutation.isPending}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            business.isEarlyAdopter
                              ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100'
                          }`}
                          title={business.isEarlyAdopter ? 'Retirer Early Adopter' : 'Definir Early Adopter'}
                        >
                          <Award className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/business/${business.slug}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Voir la page"
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

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-2xl z-50 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Nouveau Business</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBusiness} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du business *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Salon de coiffure XYZ"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prenom proprietaire *
                    </label>
                    <input
                      type="text"
                      value={ownerFirstName}
                      onChange={(e) => setOwnerFirstName(e.target.value)}
                      placeholder="Jean"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom proprietaire *
                    </label>
                    <input
                      type="text"
                      value={ownerLastName}
                      onChange={(e) => setOwnerLastName(e.target.value)}
                      placeholder="Dupont"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email proprietaire *
                  </label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="jean@exemple.com"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telephone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01 23 45 67 89"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <AddressAutocomplete
                    value={address}
                    onSelect={handleAddressSelect}
                    onClear={() => {
                      setAddress('');
                      setCity('');
                      setPostalCode('');
                    }}
                    placeholder="Rechercher une adresse..."
                    hideIcon
                    inputClassName="px-4 py-3 h-auto rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  />
                  {city && (
                    <p className="text-xs text-gray-500 mt-2">
                      {postalCode} {city}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isEarlyAdopter"
                    checked={isEarlyAdopter}
                    onChange={(e) => setIsEarlyAdopter(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="isEarlyAdopter"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-amber-500" />
                    Early Adopter
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createBusinessMutation.isPending}
                    className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                  >
                    {createBusinessMutation.isPending ? 'Creation...' : 'Creer le business'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
