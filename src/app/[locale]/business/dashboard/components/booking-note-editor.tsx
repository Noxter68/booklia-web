'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Save, X, Tag, AlertTriangle, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { BookingNote } from '@/types';

interface BookingNoteEditorProps {
  bookingId: string;
  onClose?: () => void;
}

export function BookingNoteEditor({ bookingId, onClose }: BookingNoteEditorProps) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const { data: existingNote, isLoading } = useQuery({
    queryKey: ['booking-note', bookingId],
    queryFn: async () => {
      try {
        return await api.getBookingNote(bookingId);
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    if (existingNote) {
      setContent(existingNote.content);
      setTags(existingNote.tags || []);
    }
  }, [existingNote]);

  const upsertMutation = useMutation({
    mutationFn: () =>
      api.upsertBookingNote({
        bookingId,
        content,
        tags: tags.length > 0 ? tags : undefined,
      }),
    onSuccess: () => {
      success('Note enregistrée');
      queryClient.invalidateQueries({ queryKey: ['booking-note', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['client-notes'] });
      queryClient.invalidateQueries({ queryKey: ['client-last-note'] });
    },
    onError: () => showError('Erreur lors de l\'enregistrement'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteBookingNote(bookingId),
    onSuccess: () => {
      success('Note supprimée');
      queryClient.invalidateQueries({ queryKey: ['booking-note', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['client-notes'] });
      queryClient.invalidateQueries({ queryKey: ['client-last-note'] });
      onClose?.();
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {existingNote ? 'Modifier la note' : 'Ajouter une note'}
        </h3>
        <div className="flex gap-1.5">
          {existingNote && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="rounded-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Supprimer
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full text-xs">
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 p-3 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Ne pas inclure de données médicales sensibles dans les notes.</span>
      </div>

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Diagnostic, technique utilisée, préférences, produits, sabot..."
        rows={4}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-3"
      />

      {/* Tags */}
      <div className="mb-4">
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Tags (optionnel)
        </label>
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="barbe, couleur, dégradé..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleAddTag} className="rounded-full text-xs shrink-0">
            Ajouter
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <Button
        size="sm"
        onClick={() => upsertMutation.mutate()}
        disabled={!content.trim() || upsertMutation.isPending}
        isLoading={upsertMutation.isPending}
        className="rounded-full"
      >
        <Save className="w-4 h-4 mr-2" />
        Enregistrer
      </Button>
    </div>
  );
}
