import type { Category } from './types';
import { fruits } from './fruits';
import { animals } from './animals';
import { colors } from './colors';
import { school } from './school';
import { transport } from './transport';
import { family } from './family';

export const categories: Category[] = [
  {
    id: 'fruits',
    name: 'Fruits',
    emoji: '🍎',
    color: '#ef4444',
    bgColor: '#fef2f2',
    words: fruits,
  },
  {
    id: 'animals',
    name: 'Animals',
    emoji: '🐶',
    color: '#f97316',
    bgColor: '#fff7ed',
    words: animals,
  },
  {
    id: 'colors',
    name: 'Colors',
    emoji: '🎨',
    color: '#a855f7',
    bgColor: '#faf5ff',
    words: colors,
  },
  {
    id: 'school',
    name: 'School',
    emoji: '✏️',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    words: school,
  },
  {
    id: 'transport',
    name: 'Transport',
    emoji: '🚗',
    color: '#06b6d4',
    bgColor: '#ecfeff',
    words: transport,
  },
  {
    id: 'family',
    name: 'Family',
    emoji: '👨‍👩‍👧',
    color: '#ec4899',
    bgColor: '#fdf2f8',
    words: family,
  },
];

export const getCategoryById = (id: string): Category | undefined =>
  categories.find((c) => c.id === id);
 
export const getAllWords = () =>
  categories.flatMap((c) =>
    c.words.map((w) => ({
      ...w,
      // Make id globally unique by prefixing with category id
      id: `${c.id}_${w.id}` as unknown as number,
      categoryId: c.id,
      categoryEmoji: c.emoji,
    }))
  );
  
export type { Category };
export type { VocabWord } from './types';
