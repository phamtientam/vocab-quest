export interface VocabWord {
  id: number;
  emoji: string;
  word: string;
  meaning: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  words: VocabWord[];
}
