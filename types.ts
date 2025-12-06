export interface StampFormData {
  name: string;
  theme: string;
  colors: string;
  effects: string;
  images: File[];
}

export interface GeneratedResult {
  prompt: string;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  // Armazenamos os dados do formulário sem as imagens (File objects não persistem bem em JSON/LocalStorage)
  formData: Omit<StampFormData, 'images'>;
}

export enum ProcessingState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}