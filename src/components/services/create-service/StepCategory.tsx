'use client';

/**
 * Step 2: Category Selection
 * User picks a category (or subcategory) for their service
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { PageLoader } from '@/components/ui/spinner';
import { Category } from '@/types';

interface StepCategoryProps {
  categories: Category[];
  loading: boolean;
  selectedId: string | null;
  onChange: (id: string) => void;
}

export function StepCategory({ categories, loading, selectedId, onChange }: StepCategoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return <PageLoader text="Chargement des catégories..." />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Choisissez une catégorie</h2>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {categories.map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            selectedId={selectedId}
            expandedId={expandedId}
            onSelect={onChange}
            onExpand={setExpandedId}
          />
        ))}
      </div>
    </div>
  );
}

interface CategoryItemProps {
  category: Category;
  selectedId: string | null;
  expandedId: string | null;
  onSelect: (id: string) => void;
  onExpand: (id: string | null) => void;
}

function CategoryItem({ category, selectedId, expandedId, onSelect, onExpand }: CategoryItemProps) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedId === category.id;
  const isSelected = selectedId === category.id;

  const handleClick = () => {
    if (hasChildren) {
      onExpand(isExpanded ? null : category.id);
    } else {
      onSelect(category.id);
    }
  };

  return (
    <div>
      <motion.button
        onClick={handleClick}
        className={`w-full p-4 rounded-lg border text-left transition-colors cursor-pointer ${
          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">{category.name}</span>
          {hasChildren && (
            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          )}
        </div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-4 mt-2 space-y-2"
          >
            {category.children!.map((child) => (
              <motion.button
                key={child.id}
                whileHover={{ x: 4 }}
                onClick={() => onSelect(child.id)}
                className={`w-full p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  selectedId === child.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {child.name}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
