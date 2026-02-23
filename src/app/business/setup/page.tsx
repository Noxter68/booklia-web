'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, MapPin, Phone, Mail, Globe, ArrowRight, Check, Tag } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function BusinessSetupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Only admins can access this page — customers should not create businesses
  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.replace('/');
    }
  }, [user, authLoading, router]);
  const { success, error: showError } = useToast();

  // Fetch categories for selection
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  // Get only parent categories (main categories)
  const mainCategories = categories?.filter((c) => !c.parentId) || [];

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    phone: '',
    email: user?.email || '',
    website: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const createMutation = useMutation({
    mutationFn: () => api.createBusiness(formData),
    onSuccess: () => {
      success('Votre business a été créé !');
      router.push('/business/dashboard');
    },
    onError: (err: Error) => {
      showError(err.message || 'Erreur lors de la création');
    },
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 1) return formData.name.length >= 2 && formData.categoryId.length > 0;
    if (step === 2) return formData.city.length >= 2;
    return true;
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      createMutation.mutate();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 pt-24">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-surface border border-border rounded-2xl p-6 sm:p-8"
        >
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Créez votre business</h1>
                <p className="text-muted-foreground">
                  Commençons par les informations de base
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Nom de l'établissement *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Mon Salon de Coiffure"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Décrivez votre activité en quelques mots..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Catégorie principale *
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Permet aux clients de vous trouver lors de leurs recherches
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {mainCategories.map((category: { id: string; name: string }) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => updateField('categoryId', category.id)}
                        className={`p-3 rounded-xl border text-left text-sm transition-colors cursor-pointer ${
                          formData.categoryId === category.id
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Localisation</h1>
                <p className="text-muted-foreground">
                  Où se trouve votre établissement ?
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Adresse</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="123 Rue de la Paix"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Ville *</label>
                    <Input
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Paris"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Code postal
                    </label>
                    <Input
                      value={formData.postalCode}
                      onChange={(e) => updateField('postalCode', e.target.value)}
                      placeholder="75001"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Contact</h1>
                <p className="text-muted-foreground">
                  Comment vos clients peuvent vous joindre ?
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="01 23 45 67 89"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="contact@monsalon.fr"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Site web (optionnel)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://www.monsalon.fr"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                Retour
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              isLoading={createMutation.isPending}
              className="flex-1"
            >
              {step === 3 ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Créer mon business
                </>
              ) : (
                <>
                  Continuer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
