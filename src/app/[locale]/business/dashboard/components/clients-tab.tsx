'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Loader2,
  UserCheck,
  UserPlus,
  Ban,
  ChevronRight,
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Receipt,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Save,
  X,
  Mail,
  StickyNote,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import { ClientTrustLevel } from '@/types';
import { ClientLastNoteCard } from './client-last-note-card';
import { BookingNoteEditor } from './booking-note-editor';
import { InvoiceEditor } from './invoice-editor';
import { SendInvoiceButton } from './send-invoice-button';
import { MaskedAmount } from '@/contexts/amounts-visibility-context';

function getTrustBadge(level: ClientTrustLevel) {
  switch (level) {
    case 'fiable':
      return {
        label: 'Fiable',
        icon: ShieldCheck,
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      };
    case 'peu_fiable':
      return {
        label: 'Peu fiable',
        icon: ShieldAlert,
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      };
    case 'attention':
      return {
        label: 'Attention',
        icon: AlertTriangle,
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      };
  }
}

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Accepté',
  REJECTED: 'Refusé',
  COMPLETED: 'Terminé',
  CANCELED: 'Annulé',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ACCEPTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

function NewClientModal({ isOpen, onClose, onCreated }: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (clientId: string) => void;
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.createBusinessClient({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      address: form.address || undefined,
      notes: form.notes || undefined,
    }),
    onSuccess: (data) => {
      setForm({ name: '', email: '', phone: '', address: '', notes: '' });
      setError(null);
      onCreated(data.id);
    },
    onError: (err: any) => {
      setError(err.message || 'Erreur lors de la création');
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setForm({ name: '', email: '', phone: '', address: '', notes: '' });
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canSubmit = form.name.trim().length >= 2 && form.email.includes('@');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Nouveau client</h2>
              <p className="text-sm text-muted-foreground">Créer une fiche client</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Prénom Nom"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="client@email.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="06 12 34 56 78"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Adresse</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Adresse du client"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Notes</label>
            <div className="relative">
              <StickyNote className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes internes sur le client..."
                rows={3}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>

          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!canSubmit || mutation.isPending}
            className="w-full rounded-xl"
          >
            Créer le client
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ClientsTab({ businessId, initialClientId }: {
  businessId: string;
  initialClientId?: string | null;
}) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId ?? null);
  const [showNewClient, setShowNewClient] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: clients = [], isLoading, isFetching } = useQuery({
    queryKey: ['business-clients', debouncedSearch],
    queryFn: () => api.getBusinessClients(debouncedSearch || undefined),
  });

  const isSearching = isFetching && !isLoading;

  if (selectedClientId) {
    return (
      <ClientDetail
        clientId={selectedClientId}
        businessId={businessId}
        onBack={() => setSelectedClientId(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold">Clients</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowNewClient(true)}
            className="rounded-full whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Nouveau client
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 rounded-lg border border-border bg-surface text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <NewClientModal
        isOpen={showNewClient}
        onClose={() => setShowNewClient(false)}
        onCreated={(clientId) => {
          setShowNewClient(false);
          queryClient.invalidateQueries({ queryKey: ['business-clients'] });
          setSelectedClientId(clientId);
        }}
      />

      {isLoading || isSearching ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {search ? 'Aucun client trouvé' : 'Aucun client pour le moment'}
          </p>
          {!search && (
            <p className="text-sm text-muted-foreground mt-1">
              Les clients apparaîtront ici après leur première réservation
            </p>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {/* Desktop table header */}
          <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_100px_100px_80px_40px] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Client</span>
            <span>Confiance</span>
            <span className="text-right">RDV</span>
            <span className="text-right">CA</span>
            <span className="text-right">Annulations</span>
            <span className="text-center">Bloqué</span>
            <span />
          </div>

          {clients.map((client, idx) => {
            const trust = client.stats ? getTrustBadge(client.stats.trustLevel) : null;
            const TrustIcon = trust?.icon;

            return (
              <button
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`w-full text-left cursor-pointer hover:bg-muted/30 transition-colors ${
                  idx < clients.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                {/* Mobile card layout */}
                <div className="md:hidden p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                        {(client.user?.name || client.user?.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{client.user?.name || 'Sans nom'}</p>
                        <p className="text-xs text-muted-foreground">{client.user?.email}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {trust && (
                      <Badge className={trust.className}>
                        {TrustIcon && <TrustIcon className="w-3 h-3 mr-1" />}
                        {trust.label}
                      </Badge>
                    )}
                    {client.stats && (
                      <>
                        <span className="text-muted-foreground">{client.stats.totalBookings} RDV</span>
                        <span className="font-medium"><MaskedAmount value={formatPrice(client.stats.totalRevenueCents)} /></span>
                      </>
                    )}
                    {client.isBlocked && (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <Ban className="w-3 h-3 mr-1" /> Bloqué
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Desktop row layout */}
                <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_100px_100px_80px_40px] gap-4 items-center px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                      {(client.user?.name || client.user?.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{client.user?.name || 'Sans nom'}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.user?.email}</p>
                    </div>
                  </div>
                  <div>
                    {trust && (
                      <Badge className={trust.className}>
                        {TrustIcon && <TrustIcon className="w-3 h-3 mr-1" />}
                        {trust.label}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-right">{client.stats?.totalBookings ?? 0}</span>
                  <span className="text-sm font-medium text-right"><MaskedAmount value={formatPrice(client.stats?.totalRevenueCents ?? 0)} /></span>
                  <span className="text-sm text-right">{client.stats?.canceledByClient ?? 0}</span>
                  <div className="flex justify-center">
                    {client.isBlocked && (
                      <Ban className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClientDetail({ clientId, businessId, onBack }: { clientId: string; businessId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [editingNoteBookingId, setEditingNoteBookingId] = useState<string | null>(null);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);

  const { data: client, isLoading } = useQuery({
    queryKey: ['business-client', clientId],
    queryFn: () => api.getBusinessClient(clientId),
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['business-client-bookings', clientId],
    queryFn: () => api.getBusinessClientBookings(clientId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { isBlocked?: boolean; notes?: string; phone?: string; address?: string }) =>
      api.updateBusinessClient(clientId, data),
    onSuccess: () => {
      success('Client mis à jour');
      queryClient.invalidateQueries({ queryKey: ['business-client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['business-clients'] });
      setEditingNotes(false);
    },
    onError: () => showError('Erreur lors de la mise à jour'),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: { bookingId: string; clientId: string; serviceDate?: string }) =>
      api.createInvoice(data),
    onSuccess: (data) => {
      success('Facture créée avec la prestation');
      setCreatedInvoiceId(data.id);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err: Error) => showError(err.message || 'Erreur lors de la création de la facture'),
  });

  const handleQuickInvoice = (booking: any) => {
    createInvoiceMutation.mutate({
      bookingId: booking.id,
      clientId: client!.userId,
      serviceDate: booking.scheduledAt,
    });
  };

  // If we created an invoice, show the editor
  if (createdInvoiceId) {
    return (
      <InvoiceEditor
        invoiceId={createdInvoiceId}
        businessId={businessId}
        onBack={() => setCreatedInvoiceId(null)}
      />
    );
  }

  const handleToggleBlock = () => {
    if (!client) return;
    updateMutation.mutate({ isBlocked: !client.isBlocked });
  };

  const handleSaveInfo = () => {
    updateMutation.mutate({ notes, phone, address });
  };

  const startEditing = () => {
    if (!client) return;
    setNotes(client.notes || '');
    setPhone(client.phone || '');
    setAddress(client.address || '');
    setEditingNotes(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-surface border border-border rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Client introuvable</p>
        <Button variant="outline" onClick={onBack} className="mt-4 rounded-full">
          Retour
        </Button>
      </div>
    );
  }

  const trust = client.stats ? getTrustBadge(client.stats.trustLevel) : null;
  const TrustIcon = trust?.icon;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={onBack} className="rounded-full h-9 w-9 p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary shrink-0">
            {(client.user?.name || client.user?.email || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold truncate">{client.user?.name || 'Sans nom'}</h2>
            <p className="text-sm text-muted-foreground truncate">{client.user?.email}</p>
          </div>
        </div>
        <Button
          variant={client.isBlocked ? 'default' : 'outline'}
          onClick={handleToggleBlock}
          disabled={updateMutation.isPending}
          className={`rounded-full shrink-0 ${client.isBlocked ? 'bg-red-600 hover:bg-red-700' : 'text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20'}`}
        >
          <Ban className="w-4 h-4 mr-2" />
          {client.isBlocked ? 'Débloquer' : 'Bloquer'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Stats + Info */}
        <div className="space-y-6">
          {/* Trust & Stats */}
          {client.stats && (
            <div className="bg-surface border border-border rounded-2xl p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Statistiques
              </h3>
              <div className="space-y-3">
                {trust && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confiance</span>
                    <Badge className={trust.className}>
                      {TrustIcon && <TrustIcon className="w-3.5 h-3.5 mr-1" />}
                      {trust.label}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total RDV</span>
                  <span className="font-semibold">{client.stats.totalBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Terminés</span>
                  <span className="font-semibold text-emerald-600">{client.stats.completedBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Annulations</span>
                  <span className="font-semibold text-red-600">{client.stats.canceledByClient}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taux de complétion</span>
                  <span className="font-semibold">{Math.round(client.stats.completionRate)}%</span>
                </div>
                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Chiffre d&apos;affaires</span>
                  <span className="font-bold text-primary"><MaskedAmount value={formatPrice(client.stats.totalRevenueCents)} /></span>
                </div>
                {client.stats.lastBookingAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dernière visite</span>
                    <span className="text-sm">
                      {new Date(client.stats.lastBookingAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {client.stats.servicesUsed.length > 0 && (
                  <div className="border-t border-border pt-3">
                    <span className="text-sm text-muted-foreground block mb-2">Prestations utilisées</span>
                    <div className="flex flex-wrap gap-1.5">
                      {client.stats.servicesUsed.map((service) => (
                        <Badge key={service} variant="secondary" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Last Booking Note */}
          {client.userId && (
            <ClientLastNoteCard clientId={client.userId} />
          )}

          {/* Info & Notes */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informations
              </h3>
              {!editingNotes ? (
                <Button variant="ghost" size="sm" onClick={startEditing} className="rounded-full text-xs">
                  Modifier
                </Button>
              ) : (
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={handleSaveInfo}
                    disabled={updateMutation.isPending}
                    className="rounded-full text-xs"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Enregistrer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingNotes(false)}
                    className="rounded-full text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {editingNotes ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="06 12 34 56 78"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Adresse</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Adresse du client"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes privées sur ce client..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{client.address}</span>
                  </div>
                )}
                {client.notes && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    {client.notes}
                  </div>
                )}
                {!client.phone && !client.address && !client.notes && (
                  <p className="text-sm text-muted-foreground">Aucune information enregistrée</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Booking history */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Historique des réservations
            </h3>

            {bookingsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucune réservation
              </p>
            ) : (
              <div className="space-y-2">
                {bookings.map((booking) => (
                  <div key={booking.id}>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-background">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {booking.businessService?.name || 'Service'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[booking.status]}`}>
                            {statusLabels[booking.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {booking.scheduledAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(booking.scheduledAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                              {' à '}
                              {new Date(booking.scheduledAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                          {booking.employee && (
                            <span>{booking.employee.firstName} {booking.employee.lastName}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {booking.status === 'COMPLETED' && (
                          <>
                            {booking.invoice && booking.invoice.status === 'FINALIZED' ? (
                              <SendInvoiceButton
                                invoiceId={booking.invoice.id}
                                emailSentAt={booking.invoice.emailSentAt}
                                clientEmail={client.user?.email}
                                variant="label"
                                invalidateKeys={[['business-client-bookings', clientId]]}
                              />
                            ) : !booking.invoice ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuickInvoice(booking)}
                                disabled={createInvoiceMutation.isPending}
                                className="rounded-full text-xs"
                              >
                                <Receipt className="w-3.5 h-3.5 mr-1" />
                                Facturer
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setEditingNoteBookingId(
                                  editingNoteBookingId === booking.id ? null : booking.id,
                                )
                              }
                              className="rounded-full text-xs"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" />
                              Note
                            </Button>
                          </>
                        )}
                        {booking.agreedPriceCents != null && (
                          <span className="font-semibold text-sm">
                            {formatPrice(booking.agreedPriceCents)}
                          </span>
                        )}
                      </div>
                    </div>
                    {editingNoteBookingId === booking.id && (
                      <div className="mt-2">
                        <BookingNoteEditor
                          bookingId={booking.id}
                          onClose={() => setEditingNoteBookingId(null)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
