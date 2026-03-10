'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, LogOut, ChevronDown, Menu, X, Building2, Calendar, BadgeCheck, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { Category } from '@/types';
import { NotificationBell } from '@/components/notifications/notification-bell';

export function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isLoading, logout } = useAuth();
  const { success } = useToast();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // For portal - need to wait for mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch categories for nav links
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  // Detect if user owns a business (to show "Mon entreprise" vs "Mes reservations")
  const { data: myBusiness } = useQuery({
    queryKey: ['my-business'],
    queryFn: () => api.getMyBusiness(),
    enabled: !!user,
    retry: false,
  });
  const hasBusiness = !!myBusiness;

  const handleLogout = () => {
    logout();
    success('Deconnexion reussie');
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Handle scroll visibility
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    if (currentScrollY < 50) {
      setIsVisible(true);
    } else if (currentScrollY > lastScrollY) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
    <motion.header
      initial={{ y: 0, opacity: 1 }}
      animate={{
        y: isVisible ? 0 : -100,
        opacity: isVisible ? 1 : 0
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
    >
      <div className="container mx-auto">
        <div className="bg-surface border border-border/50 rounded-2xl shadow-lg shadow-black/5 px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold">
            Booklia
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/search"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors rounded-xl hover:bg-primary/5"
            >
              <MapPin className="w-4 h-4" />
              Explorer
            </Link>
            <div className="w-px h-5 bg-border mx-1" />
            {categories?.map((category) => {
              const hasChildren = category.children && category.children.length > 0;
              if (hasChildren) {
                return (
                  <div key={category.id} className="relative group">
                    <Link
                      href={`/search?category=${category.slug}`}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted/50"
                    >
                      {category.name}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Link>
                    <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-surface border border-border/50 rounded-xl shadow-xl shadow-black/10 py-2 min-w-[200px]">
                        {category.children!.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/search?category=${category.slug}&subcategory=${sub.slug}`}
                            className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={category.id}
                  href={`/search?category=${category.slug}`}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted/50"
                >
                  {category.name}
                </Link>
              );
            })}
          </nav>

          {/* Right side - Desktop */}
          <div className="flex items-center gap-1">
            {/* Notifications - only for logged in users */}
            {user && (
              <div className="hidden md:block">
                <NotificationBell hasBusiness={hasBusiness} />
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              <Sun className="w-5 h-5 hidden dark:block" />
              <Moon className="w-5 h-5 block dark:hidden" />
            </button>

            {/* User section - Desktop */}
            <div className="hidden md:block">
              {isLoading ? (
                <div className="h-10 w-24 flex items-center justify-center">
                  <Spinner size="sm" />
                </div>
              ) : user ? (
                <div
                  ref={userMenuRef}
                  className="relative"
                  onMouseEnter={() => setUserMenuOpen(true)}
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      <span className="text-sm font-medium text-primary">
                        {(user.name || user.email)?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {user.name || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-56 bg-surface/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl shadow-black/10 py-2"
                      >
                        {/* User info */}
                        <div className="px-4 py-2 border-b border-border">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-sm">{user.name || 'Utilisateur'}</p>
                            {user.emailVerified && (
                              <BadgeCheck className="w-4 h-4 text-foreground shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>

                        {/* Menu items */}
                        <div className="py-1">
                          {hasBusiness ? (
                            <Link
                              href="/business/dashboard"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">Mon entreprise</span>
                            </Link>
                          ) : (
                            <Link
                              href="/mes-reservations"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">Mes reservations</span>
                            </Link>
                          )}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-border pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 w-full hover:bg-muted/50 transition-colors cursor-pointer text-destructive"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Deconnexion</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="rounded-xl">Connexion</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm" className="rounded-xl">Inscription</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.header>

      {/* Mobile Menu - Centered Modal */}
      {isMounted && createPortal(
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-[9998]"
                onClick={closeMobileMenu}
              />

              {/* Centered Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed inset-4 md:hidden z-[9999] flex items-center justify-center pointer-events-none"
              >
                <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden pointer-events-auto flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                    <span className="font-bold text-lg">Menu</span>
                    <button
                      onClick={closeMobileMenu}
                      className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {/* User section */}
                    {user && (
                      <div className="p-4 rounded-2xl bg-linear-to-br from-gold-soft to-muted mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                            <span className="text-lg font-bold text-primary">
                              {(user.name || user.email)?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold truncate">{user.name || 'Utilisateur'}</p>
                              {user.emailVerified && (
                                <BadgeCheck className="w-4 h-4 text-foreground shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Category Links */}
                    <div className="flex flex-wrap gap-2">
                      {categories?.map((category) => (
                        <Link
                          key={category.id}
                          href={`/search?category=${category.slug}`}
                          onClick={closeMobileMenu}
                          className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>

                    {/* Explorer */}
                    <Link
                      href="/search"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium">Explorer</span>
                        <p className="text-xs text-muted-foreground">Carte et recherche de pros</p>
                      </div>
                    </Link>

                    {/* Divider */}
                    <div className="border-t border-border my-2" />

                    {/* User actions */}
                    {user ? (
                      <>
                        {hasBusiness ? (
                          <Link
                            href="/business/dashboard"
                            onClick={closeMobileMenu}
                            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors"
                          >
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm font-medium">Mon entreprise</span>
                          </Link>
                        ) : (
                          <Link
                            href="/mes-reservations"
                            onClick={closeMobileMenu}
                            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors"
                          >
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm font-medium">Mes reservations</span>
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-4 p-4 rounded-2xl w-full hover:bg-destructive/10 transition-colors text-destructive cursor-pointer"
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="text-sm font-medium">Deconnexion</span>
                        </button>
                      </>
                    ) : (
                      <div className="space-y-3 pt-2">
                        <Link href="/auth/login" onClick={closeMobileMenu} className="block">
                          <Button variant="outline" className="w-full rounded-xl h-12">Connexion</Button>
                        </Link>
                        <Link href="/auth/register" onClick={closeMobileMenu} className="block">
                          <Button className="w-full rounded-xl h-12">Inscription</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
