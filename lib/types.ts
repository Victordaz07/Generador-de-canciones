export interface DoctrinalChecklistItem {
  question: string;
  answer: string;
}

export interface SongProposal {
  title_es: string;
  title_en: string;
  lyrics: string;
  music_bible: string;
  suno_prompt: string;
  cover_prompt: string;
  doctrinal_checklist: DoctrinalChecklistItem[];
}
