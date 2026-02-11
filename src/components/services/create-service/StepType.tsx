'use client';

/**
 * Step 1: Service Type Selection
 * User chooses between OFFER (proposing a service) or REQUEST (looking for a service)
 */
import { motion } from 'framer-motion';
import { Gift, Search } from 'lucide-react';
import { ServiceKind } from '@/types';

interface StepTypeProps {
  kind: ServiceKind | null;
  onChange: (kind: ServiceKind) => void;
}

export function StepType({ kind, onChange }: StepTypeProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Quel type de service ?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TypeCard
          type="OFFER"
          selected={kind === 'OFFER'}
          icon={Gift}
          title="Je propose un service"
          description="Vous avez une compétence ou du temps à offrir"
          onClick={() => onChange('OFFER')}
        />
        <TypeCard
          type="REQUEST"
          selected={kind === 'REQUEST'}
          icon={Search}
          title="Je cherche un service"
          description="Vous avez besoin d'aide pour quelque chose"
          onClick={() => onChange('REQUEST')}
        />
      </div>
    </div>
  );
}

interface TypeCardProps {
  type: ServiceKind;
  selected: boolean;
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}

function TypeCard({ selected, icon: Icon, title, description, onClick }: TypeCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-6 rounded-xl border-2 text-left transition-colors cursor-pointer ${
        selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
          selected ? 'bg-primary/20' : 'bg-muted'
        }`}
      >
        <Icon className={`w-6 h-6 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.button>
  );
}
