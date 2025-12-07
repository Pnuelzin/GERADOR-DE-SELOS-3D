import React, { useState, useRef, useEffect } from 'react';
import { StampFormData, GeneratedResult, ProcessingState, HistoryItem } from './types';
import { generateStampPrompt } from './services/geminiService';
import { InputGroup } from './components/InputGroup';
import { ResultCard } from './components/ResultCard';
import { HistoryList } from './components/HistoryList';

const HISTORY_KEY = 'stamp_gen_history';

const App: React.FC = () => {
  const [formData, setFormData] = useState<StampFormData>({
    name: '',
    theme: '',
    colors: '',
    effects: '',
    images: [],
  });
  const [status, setStatus] = useState<ProcessingState>(ProcessingState.IDLE);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (prompt: string, currentData: StampFormData) => {
    // We don't save images to localStorage to avoid quota limits
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { images, ...dataWithoutImages } = currentData;
    
    const newItem: HistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      prompt,
      formData: dataWithoutImages
    };

    const newHistory = [newItem, ...history];
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const handleClearHistory = () => {
    if (confirm("Tem certeza que deseja limpar todo o histórico?")) {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  const handleRestoreHistory = (data: Omit<StampFormData, 'images'>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
      images: [] // We reset images as they are not persisted
    }));
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInputChange = (field: keyof StampFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to Array
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newFiles]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.theme) {
      setErrorMsg("O nome e o tema são obrigatórios.");
      return;
    }

    setStatus(ProcessingState.GENERATING);
    setErrorMsg('');
    setResult(null);

    try {
      const promptText = await generateStampPrompt(formData);
      setResult({
        prompt: promptText,
        timestamp: Date.now()
      });
      saveToHistory(promptText, formData);
      setStatus(ProcessingState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setStatus(ProcessingState.ERROR);
      // Display the actual error message
      setErrorMsg(err.message || "Erro ao conectar com a IA. Verifique sua chave de API ou tente novamente.");
    }
  };

  const isGenerating = status === ProcessingState.GENERATING;

  return (
    <div className="min-h-screen bg-brand-dark p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-glow to-brand-accent mb-4 tracking-tight">
            Gerador de Selos 3D
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Crie prompts ultra-realistas para cartazes e selos 3D com texturas, iluminação de estúdio e efeitos visuais cinematográficos.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Column */}
          <div className="space-y-6">
            <div className="bg-brand-card p-6 rounded-xl border border-slate-700 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-white text-sm">1</span>
                Configuração
              </h2>
              
              <form onSubmit={handleSubmit}>
                <InputGroup
                  id="name"
                  label="Nome do Selo (Texto Central)"
                  value={formData.name}
                  onChange={(val) => handleInputChange('name', val)}
                  placeholder="Ex: NOITADA DE TRAVESSURAS"
                />
                
                <InputGroup
                  id="theme"
                  label="Tema"
                  value={formData.theme}
                  onChange={(val) => handleInputChange('theme', val)}
                  placeholder="Ex: Halloween, Cyberpunk, Festa Junina..."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputGroup
                    id="colors"
                    label="Cores Principais"
                    value={formData.colors}
                    onChange={(val) => handleInputChange('colors', val)}
                    placeholder="Ex: Laranja, Roxo, Neon"
                  />
                  <InputGroup
                    id="effects"
                    label="Efeitos Desejados"
                    value={formData.effects}
                    onChange={(val) => handleInputChange('effects', val)}
                    placeholder="Ex: Glow, Fogo, Metálico"
                  />
                </div>

                {/* Image Upload Area */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Referências Visuais (Opcional)
                  </label>
                  <div 
                    className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-brand-accent transition-colors cursor-pointer bg-slate-800/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      multiple 
                      onChange={handleFileChange}
                    />
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">Clique para adicionar imagens</span>
                    </div>
                  </div>
                  
                  {formData.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group w-16 h-16 rounded-md overflow-hidden border border-slate-600">
                          <img 
                            src={URL.createObjectURL(img)} 
                            alt="preview" 
                            className="w-full h-full object-cover" 
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-0 right-0 w-full h-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="p-3 mb-4 text-sm text-red-200 bg-red-900/30 border border-red-800 rounded-lg whitespace-pre-line">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isGenerating}
                  className={`w-full py-4 rounded-lg font-bold text-white shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                    isGenerating 
                      ? 'bg-slate-700 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-brand-accent to-purple-600 hover:shadow-brand-accent/50'
                  }`}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Gerando Prompt...
                    </span>
                  ) : (
                    'Gerar Prompt 3D ✨'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Result Column */}
          <div className="flex flex-col">
            <div className="bg-brand-card p-6 rounded-xl border border-slate-700 shadow-xl h-full min-h-[400px]">
               <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white text-sm">2</span>
                Resultado
              </h2>
              
              {!result && !isGenerating && (
                <div className="mb-6 flex flex-col items-center justify-center text-slate-500 h-[200px] border-2 border-dashed border-slate-800 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <p>Preencha os dados e clique em Gerar.</p>
                </div>
              )}

              {isGenerating && (
                <div className="mb-6 flex flex-col items-center justify-center h-[300px]">
                  <div className="relative w-24 h-24 mb-6">
                     <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-slate-700"></div>
                     <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-brand-accent border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-brand-glow animate-pulse text-lg font-medium">Analisando estilo...</p>
                  <p className="text-slate-500 text-sm mt-2">Renderizando estrutura do prompt 3D</p>
                </div>
              )}

              {result && (
                <ResultCard result={result} />
              )}
              
              {/* History Section rendered below result */}
              <HistoryList 
                history={history} 
                onRestore={handleRestoreHistory} 
                onClear={handleClearHistory} 
              />
            </div>
          </div>
        </div>
        
        <footer className="mt-12 text-center text-slate-600 text-sm">
          <p>Powered by Google Gemini 2.5 Flash</p>
        </footer>
      </div>
    </div>
  );
};

export default App;