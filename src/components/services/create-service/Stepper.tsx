'use client';

/**
 * Stepper Component
 * Visual progress indicator for the multi-step wizard
 */
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Step, WIZARD_STEPS } from './types';

interface StepperProps {
  currentStep: Step;
}

export function Stepper({ currentStep }: StepperProps) {
  return (
    <div className="mb-8 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[500px]">
        {WIZARD_STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: currentStep >= step.number ? 'var(--primary)' : 'var(--muted)',
                  color: currentStep >= step.number ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center font-medium text-sm"
              >
                {currentStep > step.number ? <Check className="w-4 h-4" /> : step.number}
              </motion.div>
              <span className="text-xs mt-2 text-center hidden sm:block">
                <span className="font-medium">{step.title}</span>
              </span>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: currentStep > step.number ? 'var(--primary)' : 'var(--border)',
                }}
                className="h-0.5 w-8 sm:w-16 mx-1"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
