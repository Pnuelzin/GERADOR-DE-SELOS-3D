import React, { useState } from 'react';
import { HistoryItem, StampFormData } from '../types';

interface HistoryListProps {
  history: HistoryItem[];
  onRestore: (data: Omit<StampFormData, 'images'>) => void;
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onRestore, onClear }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  if (history.length === 0) return null;

  return (
    <div className="mt-8 bg-brand-card border border-slate-700 rounded-xl p-6 shadow-xl animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Histórico Recente
        </h3>
        <button 
          onClick={onClear}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Limpar Histórico
        </button>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {history.map((item) => (
          <div key={item.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-brand-accent/30 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-500 font-mono">{formatDate(item.timestamp)}</span>
              <div className="flex gap-2">
                 <button
                  onClick={() => onRestore(item.formData)}
                  title="Reutilizar configurações"
                  className="p-1.5 rounded-md hover:bg-brand-accent/20 text-slate-400 hover:text-brand-accent transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => handleCopy(item.prompt, item.id)}
                  title="Copiar Prompt"
                  className={`p-1.5 rounded-md transition-colors ${
                    copiedId === item.id 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'hover:bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {copiedId === item.id ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="mb-3">
               <p className="text-sm font-bold text-white mb-1 truncate">{item.formData.name}</p>
               <p className="text-xs text-slate-400 truncate">{item.formData.theme} • {item.formData.effects}</p>
            </div>

            <div className="bg-slate-900 rounded p-2 text-xs text-slate-300 font-mono line-clamp-2 border border-slate-800">
              {item.prompt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};