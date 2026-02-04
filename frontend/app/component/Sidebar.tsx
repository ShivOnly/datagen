'use client'
import { History, Database, Trash2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryItem {
  id: string;
  description: string;
  timestamp: string;
}

interface SidebarProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  isCollapsed: boolean;    // Controlled from page.tsx
  onToggle: () => void;     // Controlled from page.tsx
}

export default function Sidebar({ history, onSelect, onDelete, isCollapsed, onToggle }: SidebarProps) {
  return (
    <div className={`h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Global Toggle Button */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-1 shadow-md hover:scale-110 transition-all z-50"
      >
        {isCollapsed ? <ChevronRight size={14} className="text-slate-500" /> : <ChevronLeft size={14} className="text-slate-500" />}
      </button>

      {/* Sidebar Header */}
      <div className={`p-6 border-b border-slate-100 dark:border-slate-800 ${isCollapsed ? 'px-4 flex justify-center' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 dark:bg-slate-100 p-1.5 rounded-lg shrink-0 transition-colors">
            <Database size={20} className="text-white dark:text-slate-900" />
          </div>
          {!isCollapsed && <h2 className="font-bold text-slate-800 dark:text-slate-100 truncate">Generation History</h2>}
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {history.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item)}
            className={`group relative p-3 rounded-xl border border-transparent hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-all flex items-center ${isCollapsed ? 'justify-center' : ''}`}
          >
            {!isCollapsed && (
              <div className="pr-6 truncate">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{item.description}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <Clock size={10} />
                  <span>{item.timestamp}</span>
                </div>
              </div>
            )}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="bg-slate-900 text-white p-1 rounded-md text-[10px] absolute left-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.description}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Branding - Shiv Thapa */}
      <div className={`p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 ${isCollapsed ? 'px-4' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
            ST
          </div>
          {!isCollapsed && (
            <div className="flex-1 truncate">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Shiv Thapa</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">MacBook Air Environment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}