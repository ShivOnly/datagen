'use client'
import { Trash2 } from 'lucide-react';

interface FieldCardProps {
  index: number;
  data: {
    name: string;
    description: string;
    useAI: boolean;
  };
  onUpdate: (idx: number, key: string, val: any) => void;
  onDelete?: (idx: number) => void; // Added onDelete prop for full functionality
  editable?: boolean;
}

export default function FieldCard({ index, data, onUpdate, onDelete, editable = false }: FieldCardProps) {
  return (
    <div className="flex gap-3 items-center border-2 border-slate-200 dark:border-slate-800 p-4 rounded-2xl bg-white dark:bg-slate-900/50 transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-500/50">
      {/* Column Name Input */}
      <input 
        className="flex-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 transition-colors" 
        value={data.name} 
        onChange={(e) => onUpdate(index, 'name', e.target.value)} 
        placeholder="Column Name"
      />
      
      {/* Description Input */}
      <input 
        className="flex-[2] p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 transition-colors" 
        value={data.description} 
        onChange={(e) => onUpdate(index, 'description', e.target.value)} 
        placeholder="e.g. Unique identifier"
      />
      
      {/* AI Toggle Badge */}
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap">
        <span>AI?</span>
        <input 
          type="checkbox" 
          checked={data.useAI} 
          onChange={(e) => onUpdate(index, 'useAI', e.target.checked)} 
          className="w-4 h-4 accent-blue-600 dark:accent-blue-500 cursor-pointer" 
        />
      </div>

      {/* Delete Button - Only shows if onDelete is provided */}
      {onDelete && (
        <button 
          onClick={() => onDelete(index)}
          className="p-2 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors"
          title="Remove field"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
}