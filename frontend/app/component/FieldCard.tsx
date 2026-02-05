'use client';

import { PlusCircle, MinusCircle } from 'lucide-react';

interface FieldCardProps {
  index: number;
  data: {
    name: string;
    description: string;
    useAI: boolean; // kept for backend compatibility only
  };
  onUpdate: (idx: number, key: string, val: any) => void;
  onDelete?: (idx: number) => void; // remove this field
  onAdd?: (idx: number) => void;    // add a field after this
  editable?: boolean;
}

export default function FieldCard({
  index,
  data,
  onUpdate,
  onDelete,
  onAdd,
  editable = true,
}: FieldCardProps) {
  return (
    <div className="flex gap-3 items-center border-2 border-slate-200 dark:border-slate-800 p-4 rounded-2xl bg-white dark:bg-slate-900/50 transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-500/50">
      {/* Column Name */}
      <input
        className="flex-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
        value={data.name}
        onChange={(e) => onUpdate(index, 'name', e.target.value)}
        placeholder="Column Name"
        disabled={!editable}
      />

      {/* Description */}
      <input
        className="flex-[2] p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
        value={data.description}
        onChange={(e) => onUpdate(index, 'description', e.target.value)}
        placeholder="e.g. Unique identifier"
        disabled={!editable}
      />

      {/* Row actions: Add and Remove */}
      <div className="flex items-center gap-2">
        {onAdd && (
          <button
            type="button"
            onClick={() => onAdd(index)}
            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            title="Add a field after this"
            aria-label="Add field"
          >
            <PlusCircle size={18} />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(index)}
            className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            title="Remove this field"
            aria-label="Remove field"
          >
            {/* You asked for a “-” button; MinusCircle shows a clear minus icon */}
            <MinusCircle size={18} />
          </button>
        )}
      </div>
    </div>
  );
}