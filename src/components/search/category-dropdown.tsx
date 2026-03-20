'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, X, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Category } from '@/types';

interface CategoryDropdownProps {
  categories: Category[];
  selectedCategoryId: string | undefined;
  subcategoryId: string | undefined;
  onCategorySelect: (categoryId: string) => void;
  onSubcategorySelect: (categoryId: string, subcategoryId: string) => void;
  onClear: () => void;
}

export function CategoryDropdown({
  categories,
  selectedCategoryId,
  subcategoryId,
  onCategorySelect,
  onSubcategorySelect,
  onClear,
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('search');
  const tc = useTranslations('common');

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  const selectedSubcategory = subcategoryId && selectedCategory
    ? selectedCategory.children?.find((c) => c.id === subcategoryId)
    : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (category: Category) => {
    if (category.children && category.children.length > 0) {
      setHoveredCategory(category);
    } else {
      onCategorySelect(category.id);
      setIsOpen(false);
      setHoveredCategory(null);
    }
  };

  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    onSubcategorySelect(categoryId, subcategoryId);
    setIsOpen(false);
    setHoveredCategory(null);
  };

  const getButtonLabel = () => {
    if (selectedSubcategory) {
      return selectedSubcategory.name;
    }
    if (selectedCategory) {
      return selectedCategory.name;
    }
    return t('category');
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
          selectedCategoryId
            ? 'bg-primary text-primary-foreground'
            : 'bg-surface-2 text-foreground hover:bg-muted'
        }`}
      >
        {getButtonLabel()}
        {selectedCategoryId ? (
          <X
            className="w-3.5 h-3.5 hover:opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          />
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-2 w-[600px] z-[100]"
          >
            <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/10 p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Left column - Categories */}
                <div className="border-r border-border pr-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                    {t('category')}
                  </div>
                  <div className="space-y-1 max-h-[350px] overflow-y-auto">
                    {/* All categories option */}
                    <button
                      onClick={() => {
                        onClear();
                        setIsOpen(false);
                        setHoveredCategory(null);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                        !selectedCategoryId
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'border border-transparent hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      <span className="text-sm font-medium">{t('allCategories')}</span>
                    </button>

                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category)}
                        onMouseEnter={() => {
                          if (category.children && category.children.length > 0) {
                            setHoveredCategory(category);
                          }
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
                          selectedCategoryId === category.id || hoveredCategory?.id === category.id
                            ? 'bg-primary/10 border border-primary/30'
                            : 'border border-transparent hover:border-primary/30 hover:bg-primary/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium transition-colors ${
                            selectedCategoryId === category.id || hoveredCategory?.id === category.id
                              ? 'text-primary'
                              : 'group-hover:text-primary'
                          }`}>
                            {category.name}
                          </span>
                          {category.children && category.children.length > 0 && (
                            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${
                              hoveredCategory?.id === category.id ? 'text-primary' : ''
                            }`} />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right column - Subcategories */}
                <div className="pl-2">
                  {hoveredCategory ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                          {hoveredCategory.name}
                        </div>
                        <button
                          onClick={() => {
                            onCategorySelect(hoveredCategory.id);
                            setIsOpen(false);
                            setHoveredCategory(null);
                          }}
                          className="text-xs text-primary hover:underline cursor-pointer"
                        >
                          {tc('seeAll')} →
                        </button>
                      </div>
                      <div className="space-y-1 max-h-[350px] overflow-y-auto">
                        {hoveredCategory.children && hoveredCategory.children.length > 0 ? (
                          hoveredCategory.children.map((subcategory) => (
                            <button
                              key={subcategory.id}
                              onClick={() => handleSubcategoryClick(hoveredCategory.id, subcategory.id)}
                              className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer group ${
                                subcategoryId === subcategory.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'border border-transparent hover:border-primary/30 hover:bg-primary/5'
                              }`}
                            >
                              <span className={`text-sm ${
                                subcategoryId === subcategory.id
                                  ? ''
                                  : 'group-hover:text-primary transition-colors'
                              }`}>
                                {subcategory.name}
                              </span>
                            </button>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground px-3 py-2">
                            {t('subcategory')}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {t('subcategory')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
