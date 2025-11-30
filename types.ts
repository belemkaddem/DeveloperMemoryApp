
export enum NoteType {
  COMMAND = 'COMMAND',
  SNIPPET = 'SNIPPET',
  PROCEDURE = 'PROCEDURE',
  LINK = 'LINK',
  CONFIG = 'CONFIG',
  ERROR_FIX = 'ERROR_FIX'
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown or plain text
  type: NoteType;
  tags: string[];
  createdAt: number;
  lastModified: number;
}

export interface AIReply {
  title: string;
  type: NoteType;
  formattedContent: string;
  tags: string[];
}

export type StorageMode = 'LOCAL' | 'API';

export interface AppSettings {
  storageMode: StorageMode;
  apiUrl: string;
}
