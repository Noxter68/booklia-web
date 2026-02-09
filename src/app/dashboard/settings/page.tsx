'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  User,
  Camera,
  Images,
  Plus,
  X,
  GripVertical,
  Trash2,
  ArrowLeft,
  Save,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import { ProfileImage } from '@/types';

type Tab = 'profile' | 'images';

export default function DashboardSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  // Images state
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [isReordering, setIsReordering] = useState(false);

  // Fetch profile
  const { isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const data = await api.getMe();
      if (!isProfileLoaded && data.profile) {
        setDisplayName(data.profile.displayName || '');
        setBio(data.profile.bio || '');
        setCity(data.profile.city || '');
        setAvatarUrl(data.profile.avatarUrl || '');
        setIsProfileLoaded(true);
      }
      return data;
    },
    enabled: !!user,
  });

  // Fetch profile images
  const { isLoading: imagesLoading } = useQuery({
    queryKey: ['my-profile-images'],
    queryFn: async () => {
      const data = await api.getMyProfileImages();
      setImages(data);
      return data;
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { displayName?: string; bio?: string; city?: string; avatarUrl?: string }) =>
      api.updateMyProfile(data),
    onSuccess: () => {
      success('Profil mis à jour');
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
    onError: () => showError('Erreur lors de la mise à jour'),
  });

  // Add image mutation
  const addImageMutation = useMutation({
    mutationFn: (url: string) => api.addProfileImage(url),
    onSuccess: (newImage) => {
      setImages((prev) => [...prev, newImage]);
      success('Image ajoutée');
      queryClient.invalidateQueries({ queryKey: ['my-profile-images'] });
    },
    onError: () => showError('Erreur lors de l\'ajout de l\'image'),
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: (id: string) => api.deleteProfileImage(id),
    onSuccess: (_, deletedId) => {
      setImages((prev) => prev.filter((img) => img.id !== deletedId));
      success('Image supprimée');
      queryClient.invalidateQueries({ queryKey: ['my-profile-images'] });
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  // Reorder images mutation
  const reorderImagesMutation = useMutation({
    mutationFn: (imageIds: string[]) => api.reorderProfileImages(imageIds),
    onSuccess: () => {
      success('Ordre mis à jour');
      queryClient.invalidateQueries({ queryKey: ['my-profile-images'] });
    },
    onError: () => showError('Erreur lors de la réorganisation'),
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      displayName: displayName || undefined,
      bio: bio || undefined,
      city: city || undefined,
      avatarUrl: avatarUrl || undefined,
    });
  };

  const handleAddImageUrl = () => {
    const url = prompt('Entrez l\'URL de l\'image:');
    if (url) {
      addImageMutation.mutate(url);
    }
  };

  const handleReorder = (newOrder: ProfileImage[]) => {
    setImages(newOrder);
    setIsReordering(true);
  };

  const handleSaveOrder = () => {
    const imageIds = images.map((img) => img.id);
    reorderImagesMutation.mutate(imageIds);
    setIsReordering(false);
  };

  if (authLoading || profileLoading) {
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
            <User className="w-10 h-10 text-primary" />
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
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black">Paramètres</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre profil et vos images
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
            <User className="w-4 h-4" />
            Profil
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
            Images
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-surface border border-border/50 rounded-2xl p-6"
            >
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const url = prompt('Entrez l\'URL de votre avatar:', avatarUrl);
                      if (url !== null) setAvatarUrl(url);
                    }}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <p className="font-medium">Photo de profil</p>
                  <p className="text-sm text-muted-foreground">
                    Visible sur votre profil public
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom d'affichage
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris, Lyon, Marseille..."
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Parlez-nous de vous..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {bio.length}/500 caractères
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </motion.div>
          )}

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
                  <h2 className="font-bold text-lg">Galerie d'images</h2>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez jusqu'à 10 images pour votre profil
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {images.length}/10
                </span>
              </div>

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
                  <p className="font-medium mb-1">Aucune image</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ajoutez des images pour enrichir votre profil
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={handleAddImageUrl}
                    disabled={addImageMutation.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une image
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
                          <p className="text-sm font-medium">Image {index + 1}</p>
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

                  {/* Add more images */}
                  {images.length < 10 && (
                    <button
                      onClick={handleAddImageUrl}
                      disabled={addImageMutation.isPending}
                      className="w-full mt-4 py-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Ajouter une image</span>
                    </button>
                  )}

                  {/* Save order button */}
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
                          : 'Sauvegarder l\'ordre'}
                      </Button>
                    </motion.div>
                  )}
                </>
              )}

              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Les images seront affichées sur votre profil public dans l'ordre défini.
                  Glissez-déposez pour réorganiser.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
