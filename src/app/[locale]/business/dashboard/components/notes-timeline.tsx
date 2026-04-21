'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Calendar, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookingNote } from '@/types';

interface NotesTimelineProps {
  clientId: string;
  onBack: () => void;
}

const PAGE_SIZE = 10;

export function NotesTimeline({ clientId, onBack }: NotesTimelineProps) {
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['client-notes', clientId, offset],
    queryFn: () => api.getClientNotes(clientId, PAGE_SIZE, offset),
  });

  const notes = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasMore = offset + PAGE_SIZE < total;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" onClick={onBack} className="rounded-full h-9 w-9 p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Historique des notes
          {total > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({total})
            </span>
          )}
        </h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Aucune note pour ce client
        </p>
      ) : (
        <div className="space-y-4">
          {notes.map((note: BookingNote) => (
            <div
              key={note.id}
              className="relative pl-6 pb-4 border-l-2 border-border last:border-l-0"
            >
              {/* Timeline dot */}
              <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary" />

              {/* Header */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1.5">
                {note.booking?.businessService?.name && (
                  <span className="font-medium text-foreground">
                    {note.booking.businessService.name}
                  </span>
                )}
                {note.booking?.employee && (
                  <span>
                    {note.booking.employee.firstName} {note.booking.employee.lastName}
                  </span>
                )}
                {note.booking?.scheduledAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(note.booking.scheduledAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-3 bg-muted/50 rounded-lg text-sm text-foreground whitespace-pre-wrap">
                {note.content}
              </div>

              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(offset + PAGE_SIZE)}
                className="rounded-full text-xs"
              >
                Charger plus
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
