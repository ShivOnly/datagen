'use client'
import { useState } from 'react';
import Header from './component/Header';
import FieldCard from './component/FieldCard';
import Sidebar from './component/Sidebar'; 
import { useTheme } from './context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Download, Plus, ArrowLeft, Play, Sun, Moon } from 'lucide-react';

export default function Home() {
  const { theme, toggleTheme } = useTheme(); 
  
  // NEW: Sidebar collapse state moved to page level to control layout padding
  const [sidebarIsCollapsed, setSidebarIsCollapsed] = useState(false);
  
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("hi_IN"); 
  const [fields, setFields] = useState([{ name: '', description: '', useAI: true }]);
  const [data, setData] = useState<any[]>([]);
  const [reasoning, setReasoning] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const downloadCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(",")).join("\n");
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "synthetic_data.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleGetSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/suggest-schema?description=${encodeURIComponent(description)}`, { method: 'POST' });
      const result = await res.json();
      setFields(result.fields.map((f: any) => ({ ...f, useAI: true })));
      setReasoning(result.global_reasoning);
      setStep(2);
    } catch (e) { console.error("Suggestion Error:", e); }
    setLoading(false);
  };

  const handleGenerateData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, country, rows: 20, fields })
      });
      const result = await res.json();
      const generatedData = Array.isArray(result) ? result : result.rows;
      setData(generatedData);

      const newHistoryItem = {
        id: Date.now().toString(),
        description: description || "Untitled Dataset",
        timestamp: new Date().toLocaleTimeString(),
        data: generatedData
      };
      setHistory(prev => [newHistoryItem, ...prev]);
      setStep(3);
    } catch (e) { console.error("Generation Error:", e); }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {/* Note: You'll need to update Sidebar.tsx to accept isCollapsed and onToggle 
         if you want to control it from the page, or let Sidebar manage its own 
         state and pass the value back via a callback.
      */}
      <Sidebar 
        history={history} 
        isCollapsed={sidebarIsCollapsed}
        onToggle={() => setSidebarIsCollapsed(!sidebarIsCollapsed)}
        onSelect={(item) => {
          setData(item.data);
          setDescription(item.description);
          setStep(3);
        }}
        onDelete={(id) => setHistory(prev => prev.filter(item => item.id !== id))}
      />

      {/* Dynamic padding based on sidebar state */}
      <div className={`flex-1 transition-all duration-300 ${sidebarIsCollapsed ? 'pl-20' : 'pl-64'}`}>
        <div className="p-4 md:p-8 text-slate-900 dark:text-slate-100 font-sans">
          
          <div className="flex justify-between items-center mb-8">
            <Header />
            
            {/* THE SLIDER TOGGLE */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-full border-2 border-slate-200 dark:border-slate-800 shadow-sm">
              <Sun size={18} className={theme === 'light' ? 'text-blue-600' : 'text-slate-400'} />
              <button 
                onClick={toggleTheme}
                className="relative w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full transition-all duration-300"
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white dark:bg-blue-500 rounded-full shadow-sm transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <Moon size={18} className={theme === 'dark' ? 'text-blue-400' : 'text-slate-400'} />
            </div>
          </div>

          <main className="max-w-7xl mx-auto mt-8">
            {step === 1 && (
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm max-w-3xl mx-auto animate-in fade-in zoom-in duration-300">
                <div className="mb-8 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <label className="block text-sm font-bold text-center mb-4 text-slate-600 dark:text-slate-400 italic">Select Region</label>
                  <select className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl mb-6 outline-none bg-white dark:bg-slate-800" value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option value="en_GB">England</option>
                    <option value="hi_IN">India</option>
                    <option value="en_US">USA</option>
                    <option value="ja_JP">Japan</option>
                    <option value="zh_CN">China</option>
                    <option value="fr_FR">France</option>
                    <option value="de_DE">Germany</option>
                  </select>
                  <label className="block text-sm font-bold text-center mb-4 text-slate-600 dark:text-slate-400 italic">Dataset Description</label>
                  <textarea className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl h-32 text-sm outline-none bg-white dark:bg-slate-800" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Student performance dataset..."/>
                </div>
                <div className="border-2 border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <div className="space-y-3 mb-4">
                    {fields.map((f, i) => (
                      <FieldCard key={i} index={i} data={f} onUpdate={(idx, key, val) => {
                        const updated = [...fields];
                        (updated[idx] as any)[key] = val;
                        setFields(updated);
                      }} />
                    ))}
                  </div>
                  <button onClick={() => setFields([...fields, { name: '', description: '', useAI: true }])} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <Plus size={18} /> Add more fields
                  </button>
                </div>
                <div className="flex justify-end mt-8">
                  <button onClick={handleGetSuggestions} className="px-8 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition">
                    {loading ? "Thinking..." : "See Dataset Suggestion"}
                  </button>
                </div>
              </div>
            )}

            {/* ... steps 2 and 3 remain identical to previous implementation */}
            {step === 2 && (
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm max-w-4xl mx-auto animate-in slide-in-from-right duration-300">
                <h2 className="text-lg font-bold text-center mb-8">Suggested field Names and description</h2>
                <div className="space-y-4 mb-8">
                  {fields.map((f, i) => (
                    <FieldCard key={i} index={i} data={f} editable={true} onUpdate={(idx, key, val) => {
                      const updated = [...fields];
                      (updated[idx] as any)[key] = val;
                      setFields(updated);
                    }} />
                  ))}
                </div>
                <div className="flex justify-center gap-4 mt-8">
                  <button onClick={() => setStep(1)} className="px-10 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition">
                    <ArrowLeft size={18}/> Back to Description
                  </button>
                  <button onClick={handleGenerateData} className="px-10 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition">
                    {loading ? "Generating 20 Rows..." : <>Generate and Download <Play size={18}/></>}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
                <div className="flex-[2] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h1 className="text-xl font-bold">Editable Dataset</h1>
                    <button onClick={downloadCSV} className="bg-[#00c853] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-600 transition">
                      <Download size={18}/> Download CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 border-b-2 dark:border-slate-700">
                        <tr>
                          {data.length > 0 && Object.keys(data[0]).map(k => (
                            <th key={k} className="p-4 font-bold border-r dark:border-slate-700">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, i) => (
                          <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                            {Object.entries(row).map(([k, v]) => (
                              <td key={k} className="p-0 border-r dark:border-slate-800 last:border-0">
                                <input 
                                  className="w-full p-4 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-slate-800 transition-colors" 
                                  value={v as string} 
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setData(prev => prev.map((r, idx) => idx === i ? { ...r, [k]: newValue } : r));
                                  }} 
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <aside className="flex-1 flex flex-col gap-6">
                  <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="font-bold mb-3 text-slate-800 dark:text-slate-200">AI Reasoning</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">{reasoning}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[350px]">
                    <h3 className="font-bold mb-6 text-slate-800 dark:text-slate-200">Data Distribution</h3>
                    <div className="h-64">
                      {data.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "#334155" : "#e2e8f0"} />
                            <XAxis dataKey={Object.keys(data[0])[0]} hide />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px', color: theme === 'dark' ? '#fff' : '#000' }} />
                            <Bar 
                              dataKey={Object.keys(data[0])[1] || Object.keys(data[0])[0]} 
                              fill="#3b82f6" 
                              radius={[4, 4, 0, 0]} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setStep(2)} className="w-full py-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                    Back to Settings
                  </button>
                </aside>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}