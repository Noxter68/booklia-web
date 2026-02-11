'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Building2,
  Camera,
  Images,
  Plus,
  GripVertical,
  Trash2,
  ArrowLeft,
  Save,
  Upload,
  Loader2,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import { BusinessImage, BusinessHours } from '@/types';

type Tab = 'profile' | 'images' | 'hours';

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function BusinessSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Images state
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Hours state
  const [hours, setHours] = useState<BusinessHours[]>([]);

  // Fetch business
  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['my-business'],
    queryFn: async () => {
      const data = await api.getMyBusiness();
      if (!isProfileLoaded && data) {
        setName(data.name || '');
        setDescription(data.description || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setWebsite(data.website || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setPostalCode(data.postalCode || '');
        setLogoUrl(data.logoUrl || '');
        setIsProfileLoaded(true);
      }
      return data;
    },
    enabled: !!user,
  });

  // Fetch business images
  const { isLoading: imagesLoading } = useQuery({
    queryKey: ['my-business-images'],
    queryFn: async () => {
      const data = await api.getMyBusinessImages();
      setImages(data);
      return data;
    },
    enabled: !!user,
  });

  // Fetch business hours
  const { isLoading: hoursLoading } = useQuery({
    queryKey: ['my-business-hours'],
    queryFn: async () => {
      const data = await api.getMyBusinessHours();
      // Initialize default hours if empty
      if (data.length === 0) {
        const defaultHours = [1, 2, 3, 4, 5, 6, 0].map((day) => ({
          id: `temp-${day}`,
          businessId: business?.id || '',
          dayOfWeek: day,
          startTime: day === 0 || day === 6 ? '10:00' : '09:00',
          endTime: day === 0 || day === 6 ? '18:00' : '19:00',
          isClosed: day === 0,
        }));
        setHours(defaultHours);
        return defaultHours;
      }
      setHours(data);
      return data;
    },
    enabled: !!user && !!business,
  });

  // Update business mutation
  const updateBusinessMutation = useMutation({
    mutationFn: (data: {
      name?: string;
      description?: string;
      phone?: string;
      email?: string;
      website?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      logoUrl?: string;
    }) => api.updateBusiness(data),
    onSuccess: () => {
      success('Informations mises à jour');
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError('Erreur lors de la mise à jour'),
  });

  // Add image mutation
  const addImageMutation = useMutation({
    mutationFn: (url: string) => api.addBusinessImage(url),
    onSuccess: (newImage) => {
      setImages((prev) => [...prev, newImage]);
      success('Image ajoutée');
      queryClient.invalidateQueries({ queryKey: ['my-business-images'] });
    },
    onError: () => showError("Erreur lors de l'ajout de l'image"),
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: (id: string) => api.deleteBusinessImage(id),
    onSuccess: (_, deletedId) => {
      setImages((prev) => prev.filter((img) => img.id !== deletedId));
      success('Image supprimée');
      queryClient.invalidateQueries({ queryKey: ['my-business-images'] });
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  // Reorder images mutation
  const reorderImagesMutation = useMutation({
    mutationFn: (imageIds: string[]) => api.reorderBusinessImages(imageIds),
    onSuccess: () => {
      success('Ordre mis à jour');
      queryClient.invalidateQueries({ queryKey: ['my-business-images'] });
    },
    onError: () => showError('Erreur lors de la réorganisation'),
  });

  // Update hours mutation
  const updateHoursMutation = useMutation({
    mutationFn: (hoursData: { dayOfWeek: number; startTime: string; endTime: string; isClosed?: boolean }[]) =>
      api.updateBusinessHours(hoursData),
    onSuccess: () => {
      success('Horaires mis à jour');
      queryClient.invalidateQueries({ queryKey: ['my-business-hours'] });
    },
    onError: () => showError('Erreur lors de la mise à jour des horaires'),
  });

  const handleSaveProfile = () => {
    updateBusinessMutation.mutate({
      name: name || undefined,
      description: description || undefined,
      phone: phone || undefined,
      email: email || undefined,
      website: website || undefined,
      address: address || undefined,
      city: city || undefined,
      postalCode: postalCode || undefined,
      logoUrl: logoUrl || undefined,
    });
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const result = await api.uploadFile(file, 'avatar');
      setLogoUrl(result.url);
      success('Logo uploadé');
    } catch {
      showError("Erreur lors de l'upload du logo");
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const result = await api.uploadFile(file, 'image');
      addImageMutation.mutate(result.url);
    } catch {
      showError("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReorder = (newOrder: BusinessImage[]) => {
    setImages(newOrder);
    setIsReordering(true);
  };

  const handleSaveOrder = () => {
    const imageIds = images.map((img) => img.id);
    reorderImagesMutation.mutate(imageIds);
    setIsReordering(false);
  };

  const handleHourChange = (dayOfWeek: number, field: 'startTime' | 'endTime' | 'isClosed', value: string | boolean) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    );
  };

  const handleSaveHours = () => {
    const hoursData = hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
      isClosed: h.isClosed,
    }));
    updateHoursMutation.mutate(hoursData);
  };

  if (authLoading || businessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-24">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Connectez-vous</h1>
          <p className="text-muted-foreground mb-6">
            Vous devez être connecté pour accéder à vos paramètres.
          </p>
          <Link href="/auth/login">
            <Button size="lg" className="rounded-xl px-8">Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-24">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Aucun business</h1>
          <p className="text-muted-foreground mb-6">
            Vous n'avez pas encore créé de business.
          </p>
          <Link href="/business/setup">
            <Button size="lg" className="rounded-xl px-8">Créer mon business</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/business/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black">Paramètres Business</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les informations de votre établissement
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              tab === 'profile'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Informations
          </button>
          <button
            onClick={() => setTab('images')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              tab === 'images'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Images className="w-4 h-4" />
            Photos
          </button>
          <button
            onClick={() => setTab('hours')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              tab === 'hours'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="w-4 h-4" />
            Horaires
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Profile Tab */}
          {tab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-surface border border-border/50 rounded-2xl p-6"
            >
              {/* Logo */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
                    {isUploadingLogo ? (
                      <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                    ) : logoUrl ? (
                      <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <p className="font-medium">Logo de l'établissement</p>
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour uploader (max 2 Mo)
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom de l'établissement
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mon salon"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez votre établissement..."
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {description.length}/1000 caractères
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01 23 45 67 89"
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@exemple.com"
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Site web
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.exemple.com"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Rue Exemple"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Paris"
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="75001"
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateBusinessMutation.isPending}
                  className="rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateBusinessMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Images Tab */}
          {tab === 'images' && (
            <motion.div
              key="images"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-surface border border-border/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bold text-lg">Galerie photos</h2>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez jusqu'à 10 photos de votre établissement
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {images.length}/10
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
              />

              {imagesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl bg-muted animate-pulse"
                    />
                  ))}
                </div>
              ) : images.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                  <Images className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium mb-1">Aucune photo</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ajoutez des photos pour enrichir votre page
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={addImageMutation.isPending || isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isUploadingImage ? 'Upload en cours...' : 'Ajouter une photo'}
                  </Button>
                </div>
              ) : (
                <>
                  <Reorder.Group
                    axis="y"
                    values={images}
                    onReorder={handleReorder}
                    className="space-y-3"
                  >
                    {images.map((image, index) => (
                      <Reorder.Item
                        key={image.id}
                        value={image}
                        className="bg-muted/30 rounded-xl p-3 flex items-center gap-4 cursor-grab active:cursor-grabbing"
                      >
                        <div className="text-muted-foreground">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                          <img
                            src={image.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Photo {index + 1}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {image.url}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteImageMutation.mutate(image.id)}
                          disabled={deleteImageMutation.isPending}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>

                  {images.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={addImageMutation.isPending || isUploadingImage}
                      className="w-full mt-4 py-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Upload en cours...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>Ajouter une photo</span>
                        </>
                      )}
                    </button>
                  )}

                  {isReordering && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 pt-6 border-t border-border/50"
                    >
                      <Button
                        onClick={handleSaveOrder}
                        disabled={reorderImagesMutation.isPending}
                        className="rounded-xl"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {reorderImagesMutation.isPending
                          ? 'Enregistrement...'
                          : "Sauvegarder l'ordre"}
                      </Button>
                    </motion.div>
                  )}
                </>
              )}

              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Les photos seront affichées sur votre page publique dans l'ordre défini.
                  Glissez-déposez pour réorganiser. Max 5 Mo par image.
                </p>
              </div>
            </motion.div>
          )}

          {/* Hours Tab */}
          {tab === 'hours' && (
            <motion.div
              key="hours"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-surface border border-border/50 rounded-2xl p-6"
            >
              <div className="mb-6">
                <h2 className="font-bold text-lg">Horaires d'ouverture</h2>
                <p className="text-sm text-muted-foreground">
                  Définissez vos horaires pour chaque jour de la semaine
                </p>
              </div>

              {hoursLoading ? (
                <div className="space-y-4">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => {
                    const dayHours = hours.find((h) => h.dayOfWeek === dayOfWeek);
                    const isClosed = dayHours?.isClosed ?? false;

                    return (
                      <div
                        key={dayOfWeek}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/30"
                      >
                        <div className="w-24 font-medium text-sm">
                          {DAY_NAMES[dayOfWeek]}
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isClosed}
                            onChange={(e) =>
                              handleHourChange(dayOfWeek, 'isClosed', e.target.checked)
                            }
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-muted-foreground">Fermé</span>
                        </label>
                        {!isClosed && (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={dayHours?.startTime || '09:00'}
                              onChange={(e) =>
                                handleHourChange(dayOfWeek, 'startTime', e.target.value)
                              }
                              className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                            <span className="text-muted-foreground">-</span>
                            <input
                              type="time"
                              value={dayHours?.endTime || '19:00'}
                              onChange={(e) =>
                                handleHourChange(dayOfWeek, 'endTime', e.target.value)
                              }
                              className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-border/50">
                <Button
                  onClick={handleSaveHours}
                  disabled={updateHoursMutation.isPending}
                  className="rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateHoursMutation.isPending ? 'Enregistrement...' : 'Enregistrer les horaires'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
