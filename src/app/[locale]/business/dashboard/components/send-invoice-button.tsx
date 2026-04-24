'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, Mail, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ClientSearchSelect } from './client-search-select';

interface SendInvoiceButtonProps {
  invoiceId: string;
  emailSentAt?: string | null;
  clientEmail?: string | null;
  variant?: 'icon' | 'label';
  invalidateKeys?: readonly unknown[][];
}

export function SendInvoiceButton({
  invoiceId,
  emailSentAt,
  clientEmail,
  variant = 'icon',
  invalidateKeys,
}: SendInvoiceButtonProps) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [fallbackOpen, setFallbackOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ email }: { email?: string }) =>
      api.sendInvoiceEmail(invoiceId, email),
    onSuccess: () => {
      success('Facture envoyée au client');
      setFallbackOpen(false);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      for (const key of invalidateKeys ?? []) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
    onError: (err: Error) =>
      showError(err.message || "Erreur lors de l'envoi de la facture"),
  });

  const isSent = !!emailSentAt;
  const hasClientEmail = !!clientEmail?.trim();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasClientEmail) {
      mutation.mutate({});
    } else {
      setFallbackOpen(true);
    }
  };

  const title = isSent
    ? `Envoyée le ${new Date(emailSentAt!).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })} — cliquer pour renvoyer`
    : 'Envoyer la facture par email';

  if (variant === 'label') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClick}
          disabled={mutation.isPending}
          className={`rounded-full text-xs ${
            isSent ? 'text-emerald-600 hover:text-emerald-700' : ''
          }`}
          title={title}
        >
          {mutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : isSent ? (
            <Check className="w-3.5 h-3.5 mr-1" />
          ) : (
            <Mail className="w-3.5 h-3.5 mr-1" />
          )}
          {isSent ? 'Envoyée' : 'Envoyer'}
        </Button>
        <FallbackModal
          open={fallbackOpen}
          onClose={() => setFallbackOpen(false)}
          onSubmit={(email) => mutation.mutate({ email })}
          isLoading={mutation.isPending}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={mutation.isPending}
        title={title}
        className={`p-1.5 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
          isSent
            ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
        }`}
      >
        {mutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSent ? (
          <Check className="w-4 h-4" />
        ) : (
          <Mail className="w-4 h-4" />
        )}
      </button>
      <FallbackModal
        open={fallbackOpen}
        onClose={() => setFallbackOpen(false)}
        onSubmit={(email) => mutation.mutate({ email })}
        isLoading={mutation.isPending}
      />
    </>
  );
}

function FallbackModal({
  open,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  isLoading: boolean;
}) {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [manualEmail, setManualEmail] = useState('');

  if (!open) return null;

  const finalEmail = (manualEmail.trim() || selectedEmail.trim()).trim();
  const canSubmit = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-lg font-bold">Envoyer la facture</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Ce client n&apos;a pas d&apos;adresse email enregistrée.
              Sélectionnez un client ou saisissez une adresse manuellement.
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Client
              </label>
              <ClientSearchSelect
                value={selectedClientId}
                onChange={(clientId, client) => {
                  setSelectedClientId(clientId);
                  setSelectedEmail(client?.user?.email || '');
                }}
                placeholder="Rechercher un client..."
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Ou saisir une adresse email
              </label>
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="client@email.com"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {selectedEmail && !manualEmail && (
                <p className="text-xs text-muted-foreground mt-1">
                  Destinataire : {selectedEmail}
                </p>
              )}
            </div>
          </div>

          <div className="p-5 border-t border-border/50 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-full">
              Annuler
            </Button>
            <Button
              onClick={() => onSubmit(finalEmail)}
              disabled={!canSubmit || isLoading}
              className="rounded-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-1.5" />
              )}
              Envoyer
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
