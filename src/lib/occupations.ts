import { Occupation } from './types';

/** Occupation catalog — labels/icons for the picker, plus normalization for
 *  legacy persisted values ("Salary Earner" → SALARY_EARNER, unknown → OTHER). */

export interface OccupationOption {
  key: Occupation;
  label: string;
  icon: string;
}

export const OCCUPATION_OPTIONS: OccupationOption[] = [
  { key: 'STUDENT', label: 'Student', icon: 'school' },
  { key: 'NYSC', label: 'NYSC', icon: 'ribbon' },
  { key: 'SALARY_EARNER', label: 'Salary Earner', icon: 'briefcase' },
  { key: 'FREELANCER', label: 'Freelancer', icon: 'laptop' },
  { key: 'BUSINESS_OWNER', label: 'Business Owner', icon: 'storefront' },
  { key: 'CIVIL_SERVANT', label: 'Civil Servant', icon: 'business' },
  { key: 'ARTISAN', label: 'Artisan', icon: 'construct' },
  { key: 'TRADER', label: 'Trader', icon: 'pricetags' },
  { key: 'FARMER', label: 'Farmer', icon: 'leaf' },
  { key: 'UNEMPLOYED', label: 'Unemployed', icon: 'person' },
  { key: 'RETIRED', label: 'Retired', icon: 'hourglass-outline' },
  { key: 'OTHER', label: 'Other', icon: 'ellipsis-horizontal' },
];

const KEYS = OCCUPATION_OPTIONS.map((o) => o.key) as string[];

const LABELS: Record<string, string> = Object.fromEntries(
  OCCUPATION_OPTIONS.map((o) => [o.key as string, o.label]),
);

/** Legacy human-readable values stored before the enum existed. */
const LEGACY_MAP: Record<string, Occupation> = {
  Student: 'STUDENT',
  student: 'STUDENT',
  NYSC: 'NYSC',
  'Salary Earner': 'SALARY_EARNER',
  'Salary earner': 'SALARY_EARNER',
  salary_earner: 'SALARY_EARNER',
  SALARY_EARNER: 'SALARY_EARNER',
  Freelancer: 'FREELANCER',
  freelancer: 'FREELANCER',
};

export const normalizeOccupation = (raw?: string | null): Occupation => {
  if (!raw) return 'OTHER';
  if (KEYS.includes(raw)) return raw as Occupation;
  return LEGACY_MAP[raw] ?? 'OTHER';
};

/** Display label: free text for OTHER, friendly label for everything else. */
export const occupationLabel = (raw?: string | null, other?: string): string => {
  const key = normalizeOccupation(raw);
  if (key === 'OTHER') return other?.trim() || 'Other';
  return LABELS[key] ?? 'Other';
};
