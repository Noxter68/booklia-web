'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Users } from 'lucide-react';
import type { CalendarEntry, BlockReason } from '@/types';
import { BLOCK_REASON_LABELS } from '@/lib/calendar-utils';

interface OverlapPopoverProps {
  entries: CalendarEntry[];
  onEntryClick: (entry: CalendarEntry) => void;
}

function formatLocalTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function OverlapPopover({ entries, onEntryClick }: OverlapPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Compute fixed position from badge when opening
  useEffect(() => {
    if (!isOpen || !badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const popoverWidth = 288; // w-72 = 18rem = 288px
    let left = rect.right - popoverWidth;
    if (left < 8) left = rect.left;
    if (left + popoverWidth > window.innerWidth - 8) left = window.innerWidth - popoverWidth - 8;
    setPopoverPos({ top: rect.bottom + 4, left });
  }, [isOpen]);

  // Click outside & Escape — check both badge and portal panel
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        badgeRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleBadgeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen((prev) => !prev);
  }, []);

  const handleEntrySelect = useCallback(
    (entry: CalendarEntry, e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen(false);
      onEntryClick(entry);
    },
    [onEntryClick],
  );

  return (
    <div className="absolute top-0 right-0 z-20">
      {/* Badge */}
      <button
        ref={badgeRef}
        onClick={handleBadgeClick}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-muted/80 text-muted-foreground border border-border text-[10px] font-bold cursor-pointer shadow-sm hover:scale-110 hover:bg-muted transition-transform -mt-1.5 -mr-1.5"
        title={`${entries.length} rendez-vous simultanés`}
      >
        +{entries.length - 1}
      </button>

      {/* Popover rendered via portal so it escapes overflow containers */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && popoverPos && (
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed w-72 bg-surface border border-border rounded-xl shadow-xl shadow-black/10 overflow-hidden z-9999"
                style={{ top: popoverPos.top, left: popoverPos.left }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">
                    {entries.length} rendez-vous simultanés
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-border/30">
                  {entries.map((entry) => {
                    const isBlock = entry.kind === 'BLOCK';
                    const serviceName = isBlock
                      ? (BLOCK_REASON_LABELS[
                          entry.blockReason as BlockReason
                        ] ?? 'Indisponible')
                      : (entry.businessService?.name ?? 'RDV');
                    const empName = entry.employee
                      ? `${entry.employee.firstName ?? ''} ${entry.employee.lastName ?? ''}`.trim()
                      : '';
                    const clientName = !isBlock
                      ? (entry.requester?.name ?? '')
                      : '';
                    const timeRange = `${formatLocalTime(entry.scheduledAt)} - ${formatLocalTime(entry.scheduledEndAt)}`;

                    return (
                      <button
                        key={entry.id}
                        onClick={(e) => handleEntrySelect(entry, e)}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="text-sm font-semibold truncate">
                          {serviceName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {timeRange}
                          {empName && ` \u00B7 ${empName}`}
                        </div>
                        {clientName && (
                          <div className="text-xs text-muted-foreground truncate">
                            Client: {clientName}
                          </div>
                        )}
                        {entry.notes && (
                          <div className="text-xs text-muted-foreground/70 truncate italic mt-0.5">
                            {entry.notes}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
