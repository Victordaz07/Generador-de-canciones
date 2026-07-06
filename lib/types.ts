export interface DoctrinalChecklistItem {
  question: string;
  answer: string;
}

export interface SongProposal {
  title_es: string;
  title_en: string;
  scripture_reference: string;
  lyrics: string;
  music_bible: string;
  genre: string;
  bpm: number;
  signature_sound: string;
  youtube_tags: string[];
  suno_prompt: string;
  cover_prompt: string;
  doctrinal_checklist: DoctrinalChecklistItem[];
}
