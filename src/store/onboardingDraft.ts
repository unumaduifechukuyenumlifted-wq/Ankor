/** Volatile onboarding draft — shared across screens 06–10 (not persisted). */
import { Occupation } from '../lib/types';

export interface OnboardingDraft {
  name: string;
  country: string;
  currency: string;
  occupation: Occupation | '';
  occupationOther: string;
  income: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  nextIncomeDate: string; // ISO
  goals: { name: string; priority: 'essential' | 'important' | 'optional' }[];
}

export const onboardingDraft: OnboardingDraft = {
  name: '',
  country: 'Nigeria',
  currency: 'NGN — Nigerian Naira (₦)',
  occupation: '',
  occupationOther: '',
  income: '',
  frequency: 'monthly',
  nextIncomeDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  goals: [],
};
