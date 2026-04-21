'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Clock, ChevronRight, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotesTimeline } from './notes-timeline';

interface ClientLastNoteCardProps {
  clientId: string;
}

export function ClientLastNoteCard({ clientId }: ClientLastNoteCardProps) {
  const [showTimeline, setShowTimeline] = useState(false);

  const { data: lastNote, isLoading } = useQuery({
    queryKey: ['client-last-note', clientId],
    queryFn: () => api.getClientLastNote(clientId),
    retry: false,
  });

  if (showTimeline) {
    return (
      <NotesTimeline clientId={clientId} onBack={() => setShowTimeline(false)} />
    );
  }

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="h-24 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!lastNote) {
    return null;
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Dernière note
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTimeline(true)}
          className="rounded-full text-xs"
        >
          Voir tout
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* Service & date */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
        {lastNote.booking?.businessService?.name && (
          <span className="font-medium text-foreground">
            {lastNote.booking.businessService.name}
          </span>
        )}
        {lastNote.booking?.scheduledAt && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(lastNote.booking.scheduledAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 bg-muted/50 rounded-lg text-sm text-foreground mb-2 whitespace-pre-wrap">
        {lastNote.content}
      </div>

      {/* Tags */}
      {lastNote.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {lastNote.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
