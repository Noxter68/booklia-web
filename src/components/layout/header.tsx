'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, LogOut, ChevronDown, ChevronRight, ChevronLeft, User, LayoutDashboard, Plus, Settings, Menu, X, Search, Building2, Grid3X3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { Category } from '@/types';

export function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isLoading, logout } = useAuth();
  const { success } = useToast();

  const [servicesOpen, setServicesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [mobileSelectedCategory, setMobileSelectedCategory] = useState<Category | null>(null);
  const [mobileView, setMobileView] = useState<'main' | 'categories' | 'subcategories'>('main');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // For portal - need to wait for mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const handleLogout = () => {
    logout();
    success('Déconnexion réussie');
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    // Reset mobile menu state after animation
    setTimeout(() => {
      setMobileView('main');
      setMobileSelectedCategory(null);
    }, 200);
  };

  const navigateToSubcategory = (categoryId: string, subcategoryId: string) => {
    router.push(`/search?categoryId=${categoryId}&subcategoryId=${subcategoryId}`);
    setServicesOpen(false);
    setSelectedCategory(null);
  };

  const navigateToCategory = (categoryId: string) => {
    router.push(`/search?categoryId=${categoryId}`);
    setServicesOpen(false);
    setSelectedCategory(null);
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
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setServicesOpen(false);
      }
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
            Sidely
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Services Dropdown */}
            <div
              ref={servicesRef}
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                className="flex items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-xl hover:bg-muted/50"
              >
                Services
                <ChevronDown className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {servicesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[800px]"
                  >
                    <div className="bg-surface/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl shadow-black/10 p-6">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Left column - Categories */}
                        <div className="border-r border-border pr-6">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">
                            Catégories
                          </div>
                          <div className="space-y-1 max-h-[400px] overflow-y-auto">
                            {categories?.map((category) => (
                              <button
                                key={category.id}
                                onClick={() => setSelectedCategory(selectedCategory?.id === category.id ? null : category)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group ${
                                  selectedCategory?.id === category.id
                                    ? 'bg-primary/10 border border-primary/30'
                                    : 'border border-transparent hover:border-primary/30 hover:bg-primary/5'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium transition-colors ${
                                    selectedCategory?.id === category.id ? 'text-primary' : 'group-hover:text-primary'
                                  }`}>
                                    {category.name}
                                  </span>
                                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${
                                    selectedCategory?.id === category.id ? 'rotate-90 text-primary' : ''
                                  }`} />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Right column - Subcategories */}
                        <div className="pl-2">
                          {selectedCategory ? (
                            <>
                              <div className="flex items-center justify-between mb-4">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                                  {selectedCategory.name}
                                </div>
                                <button
                                  onClick={() => navigateToCategory(selectedCategory.id)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Voir tout →
                                </button>
                              </div>
                              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                                {selectedCategory.children && selectedCategory.children.length > 0 ? (
                                  selectedCategory.children.map((subcategory) => (
                                    <button
                                      key={subcategory.id}
                                      onClick={() => navigateToSubcategory(selectedCategory.id, subcategory.id)}
                                      className="w-full text-left px-4 py-2.5 rounded-xl border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
                                    >
                                      <span className="text-sm group-hover:text-primary transition-colors">
                                        {subcategory.name}
                                      </span>
                                    </button>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground px-4 py-2">
                                    Aucune sous-catégorie
                                  </p>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Search className="w-7 h-7 text-muted-foreground" />
                              </div>
                              <p className="text-muted-foreground text-sm">
                                Sélectionnez une catégorie<br />pour voir les sous-catégories
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                        <Link
                          href="/search"
                          onClick={() => { setServicesOpen(false); setSelectedCategory(null); }}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          Voir tous les services →
                        </Link>
                        {user && (
                          <Link
                            href="/dashboard/services/new"
                            onClick={() => { setServicesOpen(false); setSelectedCategory(null); }}
                            className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary-hover transition-colors font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            Créer un service
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Simple link - Rechercher only */}
            <Link
              href="/search"
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted/50"
            >
              Rechercher
            </Link>
          </nav>

          {/* Right side - Desktop */}
          <div className="flex items-center gap-1">
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
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
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
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{user.name || 'Utilisateur'}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gold-soft text-primary dark:bg-gold-soft dark:text-primary">
                              {user.isBusiness ? 'Pro' : 'Particulier'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>

                        {/* Menu items */}
                        <div className="py-1">
                          <Link
                            href={`/profile/${user.id}`}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Mon profil</span>
                          </Link>
                          <Link
                            href={user.isBusiness ? '/business/dashboard' : '/dashboard'}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            {user.isBusiness ? (
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">{user.isBusiness ? 'Mon entreprise' : 'Dashboard'}</span>
                          </Link>
                          {!user.isBusiness && (
                            <Link
                              href="/dashboard/services/new"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">Créer un service</span>
                            </Link>
                          )}
                          <Link
                            href="/dashboard/settings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <Settings className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Paramètres</span>
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-border pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 w-full hover:bg-muted/50 transition-colors cursor-pointer text-destructive"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Déconnexion</span>
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
                    {mobileView !== 'main' ? (
                      <button
                        onClick={() => {
                          if (mobileView === 'subcategories') {
                            setMobileView('categories');
                          } else {
                            setMobileView('main');
                            setMobileSelectedCategory(null);
                          }
                        }}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm">Retour</span>
                      </button>
                    ) : (
                      <span className="font-bold text-lg">Menu</span>
                    )}
                    <button
                      onClick={closeMobileMenu}
                      className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                      {/* Main View */}
                      {mobileView === 'main' && (
                        <motion.div
                          key="main"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.15 }}
                          className="p-4 space-y-2"
                        >
                          {/* User section */}
                          {user && (
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-gold-soft to-muted mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                  <span className="text-lg font-bold text-primary">
                                    {(user.name || user.email)?.[0]?.toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold truncate">{user.name || 'Utilisateur'}</p>
                                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Navigation Links */}
                          <Link
                            href="/search"
                            onClick={closeMobileMenu}
                            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Search className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <span className="font-medium">Rechercher</span>
                              <p className="text-xs text-muted-foreground">Trouvez des services</p>
                            </div>
                          </Link>

                          <button
                            onClick={() => setMobileView('categories')}
                            className="flex items-center justify-between w-full p-4 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Grid3X3 className="w-5 h-5 text-primary" />
                              </div>
                              <div className="text-left">
                                <span className="font-medium">Catégories</span>
                                <p className="text-xs text-muted-foreground">Parcourir par catégorie</p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </button>

                          {/* Divider */}
                          <div className="border-t border-border my-2" />

                          {/* User actions */}
                          {user ? (
                            <>
                              <Link
                                href={`/profile/${user.id}`}
                                onClick={closeMobileMenu}
                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors"
                              >
                                <User className="w-5 h-5 text-muted-foreground" />
                                <span className="text-sm font-medium">Mon profil</span>
                              </Link>
                              <Link
                                href={user.isBusiness ? '/business/dashboard' : '/dashboard'}
                                onClick={closeMobileMenu}
                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors"
                              >
                                {user.isBusiness ? (
                                  <Building2 className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
                                )}
                                <span className="text-sm font-medium">{user.isBusiness ? 'Mon entreprise' : 'Dashboard'}</span>
                              </Link>
                              {!user.isBusiness && (
                                <Link
                                  href="/dashboard/services/new"
                                  onClick={closeMobileMenu}
                                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors"
                                >
                                  <Plus className="w-5 h-5 text-muted-foreground" />
                                  <span className="text-sm font-medium">Créer un service</span>
                                </Link>
                              )}
                              <Link
                                href="/dashboard/settings"
                                onClick={closeMobileMenu}
                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors"
                              >
                                <Settings className="w-5 h-5 text-muted-foreground" />
                                <span className="text-sm font-medium">Paramètres</span>
                              </Link>
                              <button
                                onClick={handleLogout}
                                className="flex items-center gap-4 p-4 rounded-2xl w-full hover:bg-destructive/10 transition-colors text-destructive cursor-pointer"
                              >
                                <LogOut className="w-5 h-5" />
                                <span className="text-sm font-medium">Déconnexion</span>
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
                        </motion.div>
                      )}

                      {/* Categories View */}
                      {mobileView === 'categories' && (
                        <motion.div
                          key="categories"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.15 }}
                          className="p-4"
                        >
                          <h3 className="text-lg font-bold mb-4">Catégories</h3>
                          <div className="space-y-2">
                            {categories?.map((category) => (
                              <button
                                key={category.id}
                                onClick={() => {
                                  if (category.children && category.children.length > 0) {
                                    setMobileSelectedCategory(category);
                                    setMobileView('subcategories');
                                  } else {
                                    navigateToCategory(category.id);
                                    closeMobileMenu();
                                  }
                                }}
                                className="flex items-center justify-between w-full p-4 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer group"
                              >
                                <span className="font-medium group-hover:text-primary transition-colors">
                                  {category.name}
                                </span>
                                {category.children && category.children.length > 0 && (
                                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Subcategories View */}
                      {mobileView === 'subcategories' && mobileSelectedCategory && (
                        <motion.div
                          key="subcategories"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.15 }}
                          className="p-4"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">{mobileSelectedCategory.name}</h3>
                            <button
                              onClick={() => {
                                navigateToCategory(mobileSelectedCategory.id);
                                closeMobileMenu();
                              }}
                              className="text-sm text-primary font-medium hover:underline cursor-pointer"
                            >
                              Voir tout
                            </button>
                          </div>
                          <div className="space-y-2">
                            {mobileSelectedCategory.children?.map((subcategory) => (
                              <button
                                key={subcategory.id}
                                onClick={() => {
                                  navigateToSubcategory(mobileSelectedCategory.id, subcategory.id);
                                  closeMobileMenu();
                                }}
                                className="flex items-center w-full p-4 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer group"
                              >
                                <span className="text-sm group-hover:text-primary transition-colors">
                                  {subcategory.name}
                                </span>
                              </button>
                            ))}
                            {(!mobileSelectedCategory.children || mobileSelectedCategory.children.length === 0) && (
                              <p className="text-sm text-muted-foreground p-4">
                                Aucune sous-catégorie disponible
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
