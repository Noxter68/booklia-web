'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Loader2, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { BusinessClient } from '@/types';

interface ClientSearchSelectProps {
  value: string;
  onChange: (clientId: string, client?: BusinessClient) => void;
  placeholder?: string;
  className?: string;
}

export function ClientSearchSelect({
  value,
  onChange,
  placeholder = 'Rechercher un client...',
  className,
}: ClientSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BusinessClient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<BusinessClient | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial client if value is set
  useEffect(() => {
    if (value && !selectedClient) {
      api.getBusinessClients().then((clients) => {
        const found = clients.find((c) => c.userId === value);
        if (found) setSelectedClient(found);
      });
    }
  }, [value, selectedClient]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchClients = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const clients = await api.getBusinessClients(searchQuery || undefined);
      setResults(clients);
      setIsOpen(true);
      setSelectedIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      searchClients(newQuery);
    }, 300);
  };

  const handleFocus = () => {
    // Load initial results on focus
    if (results.length === 0) {
      searchClients(query);
    } else {
      setIsOpen(true);
    }
  };

  const handleSelect = (client: BusinessClient) => {
    setSelectedClient(client);
    setQuery('');
    setIsOpen(false);
    onChange(client.userId, client);
  };

  const handleClear = () => {
    setSelectedClient(null);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) handleSelect(results[selectedIndex]);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const getClientDisplay = (client: BusinessClient) => {
    const name = client.user?.name;
    const email = client.user?.email;
    return { name: name || 'Client', email: email || '' };
  };

  // Selected state
  if (selectedClient) {
    const { name, email } = getClientDisplay(selectedClient);
    return (
      <div className={cn('relative', className)}>
        <div className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg bg-background">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {selectedClient.user?.image ? (
              <img src={selectedClient.user.image} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <User className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium truncate block">{name}</span>
            {email && <span className="text-xs text-muted-foreground truncate block">{email}</span>}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Search state
  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg">
          {results.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              {isLoading ? 'Recherche...' : query ? 'Aucun client trouvé' : 'Aucun client'}
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {results.map((client, index) => {
                const { name, email } = getClientDisplay(client);
                return (
                  <li
                    key={client.id}
                    onClick={() => handleSelect(client)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 cursor-pointer text-sm',
                      index === selectedIndex ? 'bg-muted' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {client.user?.image ? (
                        <img src={client.user.image} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{name}</span>
                      {email && <span className="text-xs text-muted-foreground truncate block">{email}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
