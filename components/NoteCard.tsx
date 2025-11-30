import React, { useState } from 'react';
import { Note, NoteType } from '../types';
import { Terminal, Code, FileText, Link as LinkIcon, Settings, AlertTriangle, Copy, Trash2, Edit } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onEdit: (note: Note) => void;
}

const getTypeIcon = (type: NoteType) => {
  switch (type) {
    case NoteType.COMMAND: return <Terminal size={18} className="text-green-400" />;
    case NoteType.SNIPPET: return <Code size={18} className="text-blue-400" />;
    case NoteType.PROCEDURE: return <FileText size={18} className="text-yellow-400" />;
    case NoteType.LINK: return <LinkIcon size={18} className="text-purple-400" />;
    case NoteType.CONFIG: return <Settings size={18} className="text-gray-400" />;
    case NoteType.ERROR_FIX: return <AlertTriangle size={18} className="text-red-400" />;
    default: return <FileText size={18} />;
  }
};

const getTypeLabel = (type: NoteType) => {
  switch (type) {
    case NoteType.COMMAND: return 'Commande';
    case NoteType.SNIPPET: return 'Snippet';
    case NoteType.PROCEDURE: return 'Procédure';
    case NoteType.LINK: return 'Lien / Doc';
    case NoteType.CONFIG: return 'Config / Env';
    case NoteType.ERROR_FIX: return 'Fix Erreur';
    default: return 'Autre';
  }
};

export const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onEdit }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 hover:border-dark-500 transition-colors shadow-sm group flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-dark-900 rounded-md border border-dark-700">
            {getTypeIcon(note.type)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-100 leading-tight">{note.title}</h3>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{getTypeLabel(note.type)}</span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(note)} 
            className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition"
            title="Modifier"
          >
            <Edit size={14} />
          </button>
          <button 
            onClick={() => onDelete(note.id)} 
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-dark-700 rounded transition"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative mb-3">
        {/* Simple rendering of content. For code, we use a monospace block. */}
        <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap bg-dark-900 p-3 rounded-md border border-dark-700 max-h-60 overflow-y-auto custom-scrollbar">
          {note.content}
        </pre>
        <button 
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 bg-dark-800/80 backdrop-blur rounded border border-dark-600 text-gray-400 hover:text-white transition"
          >
            {copied ? <span className="text-green-400 text-xs font-bold">Copié!</span> : <Copy size={14} />}
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mt-auto">
        {note.tags.map(tag => (
          <span key={tag} className="text-xs px-2 py-0.5 bg-dark-700 text-gray-300 rounded-full border border-dark-600">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
};
