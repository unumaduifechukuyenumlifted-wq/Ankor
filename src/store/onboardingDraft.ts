/** Volatile onboarding draft — shared across screens 06–10 (not persisted).
 *  Country/currency are intentionally absent: they are fixed NG/NGN values
 *  (see src/lib/locale.ts), not onboarding inputs. */
import { Occupation } from '../lib/types';

export interface OnboardingDraft {
  name: string;
  occupation: Occupation | '';
  occupationOther: string;
  income: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  nextIncomeDate: string; // ISO
  goals: { name: string; priority: 'essential' | 'important' | 'optional' }[];
}

export const onboardingDraft: OnboardingDraft = {
  name: '',
  occupation: '',
  occupationOther: '',
  income: '',
  frequency: 'monthly',
  nextIncomeDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  goals: [],
};
