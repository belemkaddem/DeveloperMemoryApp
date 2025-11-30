import React, { useState, useEffect, useMemo } from 'react';
import { Note, NoteType, AppSettings, StorageMode } from './types';
import { NoteCard } from './components/NoteCard';
import { analyzeContentWithGemini } from './services/geminiService';
import { storage, apiService, getSettings, saveSettings, DEFAULT_SETTINGS } from './services/storageService';
import { generateProjectZip } from './services/projectGenerator';
import { Plus, Search, BrainCircuit, X, Save, RefreshCw, Loader2, Command, Settings as SettingsIcon, Database, Server, WifiOff, Download } from 'lucide-react';

export default function App() {
  // Config State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Data State
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<NoteType | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<NoteType>(NoteType.SNIPPET);
  const [formTags, setFormTags] = useState('');

  // Initial Load
  useEffect(() => {
    const loadedSettings = getSettings();
    setSettings(loadedSettings);
    loadNotes(loadedSettings);
  }, []);

  const loadNotes = async (currentSettings: AppSettings) => {
    setIsLoadingData(true);
    setDataError(null);
    try {
        let loadedNotes: Note[] = [];
        if (currentSettings.storageMode === 'LOCAL') {
            loadedNotes = await storage.local.getAll();
            if (loadedNotes.length === 0) {
                 // Seed initial data only for local
                loadedNotes = seedLocalData();
            }
        } else {
            // API Mode
            try {
                loadedNotes = await apiService.getAll(currentSettings.apiUrl);
            } catch (err) {
                console.error(err);
                throw new Error(`Impossible de se connecter à ${currentSettings.apiUrl}. Vérifiez que votre Spring Boot tourne.`);
            }
        }
        // Tri par date de modif décroissante
        setNotes(loadedNotes.sort((a,b) => b.lastModified - a.lastModified));
    } catch (e: any) {
        setDataError(e.message || "Erreur de chargement");
    } finally {
        setIsLoadingData(false);
    }
  };

  const seedLocalData = (): Note[] => {
      const initialNotes: Note[] = [
        {
            id: '1',
            title: 'Maven Skip Tests',
            content: 'mvn clean install -DskipTests',
            type: NoteType.COMMAND,
            tags: ['maven', 'build'],
            createdAt: Date.now(),
            lastModified: Date.now()
        },
         {
            id: '2',
            title: 'Spring Boot Profile',
            content: '-Dspring.profiles.active=dev',
            type: NoteType.CONFIG,
            tags: ['spring', 'jvm'],
            createdAt: Date.now(),
            lastModified: Date.now()
        }
    ];
    localStorage.setItem('devmemory_notes', JSON.stringify(initialNotes));
    return initialNotes;
  }

  // Save Settings
  const handleSaveSettings = () => {
      saveSettings(settings);
      setIsSettingsOpen(false);
      loadNotes(settings);
  };

  // Derived state for filtering
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = selectedType === 'ALL' || note.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [notes, searchQuery, selectedType]);

  // Handlers
  const handleOpenModal = (note?: Note) => {
    if (note) {
      setEditingNoteId(note.id);
      setFormTitle(note.title);
      setFormContent(note.content);
      setFormType(note.type);
      setFormTags(note.tags.join(', '));
    } else {
      setEditingNoteId(null);
      setFormTitle('');
      setFormContent('');
      setFormType(NoteType.SNIPPET);
      setFormTags('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsAiLoading(false);
  };

  const handleAiAnalyze = async () => {
    if (!formContent.trim()) return;
    
    setIsAiLoading(true);
    try {
      const result = await analyzeContentWithGemini(formContent);
      setFormTitle(result.title);
      setFormType(result.type);
      setFormContent(result.formattedContent);
      setFormTags(result.tags.join(', '));
    } catch (error) {
      alert("Erreur lors de l'analyse AI. Vérifiez votre clé API.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    const tagsArray = formTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const now = Date.now();

    try {
        let savedNote: Note;
        const noteData: Note = {
            id: editingNoteId || crypto.randomUUID(), // Backend might override ID on create
            title: formTitle,
            content: formContent,
            type: formType,
            tags: tagsArray,
            createdAt: editingNoteId ? (notes.find(n => n.id === editingNoteId)?.createdAt || now) : now,
            lastModified: now
        };

        if (settings.storageMode === 'LOCAL') {
             savedNote = await storage.local.save(noteData);
        } else {
             if (editingNoteId) {
                 savedNote = await apiService.update(settings.apiUrl, noteData);
             } else {
                 savedNote = await apiService.create(settings.apiUrl, noteData);
             }
        }

        // Optimistic UI update or Reload
        if (editingNoteId) {
            setNotes(prev => prev.map(n => n.id === savedNote.id ? savedNote : n));
        } else {
            setNotes(prev => [savedNote, ...prev]);
        }
        
        handleCloseModal();
    } catch (e) {
        alert("Erreur lors de la sauvegarde: " + e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;
    
    try {
        if (settings.storageMode === 'LOCAL') {
            await storage.local.delete(id);
        } else {
            await apiService.delete(settings.apiUrl, id);
        }
        setNotes(prev => prev.filter(n => n.id !== id));
    } catch (e) {
        alert("Erreur suppression: " + e);
    }
  };

  const handleDownloadCode = async () => {
      try {
          await generateProjectZip();
      } catch (e) {
          console.error(e);
          alert("Erreur lors de la génération du ZIP.");
      }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-gray-200 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-dark-800 border-r border-dark-700 flex-shrink-0 flex flex-col h-auto md:h-screen sticky top-0 z-10">
        <div className="p-6 border-b border-dark-700">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-java-500 to-orange-400 flex items-center gap-2">
            <Command className="text-java-500" />
            DevMemory
          </h1>
          <p className="text-xs text-gray-500 mt-1">Second cerveau Java/Spring</p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <button 
            onClick={() => handleOpenModal()}
            className="w-full py-3 px-4 bg-java-600 hover:bg-java-500 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 mb-6 shadow-lg shadow-java-600/20"
          >
            <Plus size={18} />
            Nouvelle Note
          </button>

          <nav className="space-y-1">
             {/* Filters ... (same as before) */}
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filtres</p>
            {[
              { id: 'ALL', label: 'Tout voir' },
              { id: NoteType.COMMAND, label: 'Commandes' },
              { id: NoteType.SNIPPET, label: 'Snippets Code' },
              { id: NoteType.PROCEDURE, label: 'Procédures' },
              { id: NoteType.LINK, label: 'Docs & Liens' },
              { id: NoteType.CONFIG, label: 'Configs / Env' },
              { id: NoteType.ERROR_FIX, label: 'Fix Erreurs' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedType(item.id as NoteType | 'ALL')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedType === item.id ? 'bg-dark-700 text-white' : 'text-gray-400 hover:bg-dark-700/50 hover:text-gray-200'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Footer with Settings */}
        <div className="p-4 border-t border-dark-700">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-java-500 transition w-full justify-center"
            >
                <SettingsIcon size={14} />
                {settings.storageMode === 'LOCAL' ? 'Mode Local (LocalStorage)' : 'Mode API (Spring Boot)'}
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="p-4 md:p-6 bg-dark-900/80 backdrop-blur border-b border-dark-700 sticky top-0 z-20 flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-java-500/50 text-gray-200 placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            {isLoadingData && <Loader2 className="animate-spin text-java-500" />}
            {settings.storageMode === 'API' && (
                <div className="px-3 py-1 bg-dark-800 border border-dark-700 rounded-full flex items-center gap-2 text-xs text-green-400">
                    <Server size={12} />
                    <span>Connecté: Spring Boot</span>
                </div>
            )}
          </div>
        </header>

        {/* Note Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-dark-900">
          <div className="max-w-6xl mx-auto">
            {dataError ? (
                <div className="flex flex-col items-center justify-center h-64 text-red-400">
                    <WifiOff size={48} className="mb-4 opacity-50" />
                    <p className="font-bold">Erreur de connexion</p>
                    <p className="text-sm opacity-80 mt-1">{dataError}</p>
                    <button onClick={() => setIsSettingsOpen(true)} className="mt-4 px-4 py-2 bg-dark-800 rounded text-white text-sm">Vérifier Config</button>
                </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center mt-20 text-gray-500">
                <BrainCircuit size={48} className="mx-auto mb-4 opacity-20" />
                <p>Aucune information trouvée.</p>
                <p className="text-sm">Ajoutez votre première note via le bouton "Nouvelle Note".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map(note => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    onDelete={handleDelete}
                    onEdit={handleOpenModal}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-800 w-full max-w-2xl rounded-xl border border-dark-600 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-dark-700">
              <h2 className="text-lg font-bold text-white">
                {editingNoteId ? 'Modifier la note' : 'Nouvelle Note'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Contenu
                </label>
                <textarea 
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Collez ici votre information..."
                  className="w-full h-40 p-3 bg-dark-900 border border-dark-700 rounded-lg text-sm font-mono text-gray-200 focus:outline-none focus:border-java-500"
                />
                <div className="mt-2 flex justify-end">
                  <button 
                    onClick={handleAiAnalyze}
                    disabled={isAiLoading || !formContent.trim()}
                    className="flex items-center gap-2 text-xs font-medium text-java-500 hover:text-java-600 disabled:opacity-50 transition-colors"
                  >
                    {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                    {isAiLoading ? 'Analyse en cours...' : 'Organiser avec IA (Gemini)'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Titre</label>
                    <input 
                      type="text" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full p-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-java-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Type</label>
                    <select 
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as NoteType)}
                      className="w-full p-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-java-500"
                    >
                      {Object.values(NoteType).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Tags</label>
                <input 
                  type="text" 
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full p-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-java-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-dark-700 flex justify-end gap-3">
              <button 
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition"
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveNote}
                className="px-6 py-2 bg-java-600 hover:bg-java-500 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                <Save size={16} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-dark-800 w-full max-w-md rounded-xl border border-dark-600 shadow-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <SettingsIcon size={20} className="text-gray-400" />
                    Configuration Stockage
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Mode de stockage</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setSettings({...settings, storageMode: 'LOCAL'})}
                                className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center gap-2 ${settings.storageMode === 'LOCAL' ? 'bg-java-600/20 border-java-600 text-java-500' : 'bg-dark-900 border-dark-700 text-gray-400'}`}
                            >
                                <Database size={20} />
                                Local Browser
                            </button>
                            <button 
                                onClick={() => setSettings({...settings, storageMode: 'API'})}
                                className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center gap-2 ${settings.storageMode === 'API' ? 'bg-java-600/20 border-java-600 text-java-500' : 'bg-dark-900 border-dark-700 text-gray-400'}`}
                            >
                                <Server size={20} />
                                Spring Boot API
                            </button>
                        </div>
                    </div>

                    {settings.storageMode === 'API' && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">API URL</label>
                            <input 
                                type="text" 
                                value={settings.apiUrl}
                                onChange={(e) => setSettings({...settings, apiUrl: e.target.value})}
                                placeholder="http://localhost:8080/api/notes"
                                className="w-full p-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-gray-200 font-mono focus:outline-none focus:border-java-500"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Assurez-vous que CORS est activé sur votre Controller Spring (@CrossOrigin)</p>
                        </div>
                    )}

                    {/* DOWNLOAD BUTTON */}
                    <div className="pt-4 mt-4 border-t border-dark-700">
                        <button 
                            onClick={handleDownloadCode}
                            className="w-full py-3 px-4 bg-dark-700 hover:bg-dark-600 text-gray-200 rounded-lg font-medium transition flex items-center justify-center gap-2"
                        >
                            <Download size={18} className="text-java-500" />
                            Télécharger Code Source (ZIP)
                        </button>
                        <p className="text-[10px] text-center text-gray-500 mt-2">
                            Contient: Backend Java Spring Boot + Frontend Angular
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition"
                    >
                        Fermer
                    </button>
                    <button 
                        onClick={handleSaveSettings}
                        className="px-4 py-2 bg-java-600 hover:bg-java-500 text-white rounded-lg text-sm font-medium transition"
                    >
                        Appliquer
                    </button>
                </div>
           </div>
        </div>
      )}
    </div>
  );
}