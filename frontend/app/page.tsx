'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from './component/Header';
import FieldCard from './component/FieldCard';
import Sidebar from './component/Sidebar';
import { useTheme } from './context/ThemeContext';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Download, Plus, ArrowLeft, Play, Sun, Moon } from 'lucide-react';

type DataRow = Record<string, string | number | boolean | null | undefined>;
type ChartType = 'bar' | 'line' | 'pie';

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  // Sidebar collapse state (controls layout padding)
  const [sidebarIsCollapsed, setSidebarIsCollapsed] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('hi_IN');
  const [fields, setFields] = useState<{ name: string; description: string; useAI: boolean }[]>([
    { name: '', description: '', useAI: true },
  ]);
  const [data, setData] = useState<DataRow[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    { id: string; description: string; timestamp: string; data: DataRow[] }[]
  >([]);

  /** =========================
   *  CSV download
   *  ========================= */
  const downloadCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data
      .map((row) =>
        Object.values(row)
          .map((v) => {
            const s = v == null ? '' : String(v);
            return s.includes(',') || s.includes('"') || s.includes('\n')
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          })
          .join(',')
      )
      .join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'synthetic_data.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  /** =========================
   *  Field add/remove for FieldCard
   *  ========================= */
  const handleAddFieldAfter = (afterIndex: number) => {
    const newField = { name: '', description: '', useAI: true };
    setFields((prev) => {
      const copy = [...prev];
      copy.splice(afterIndex + 1, 0, newField);
      return copy;
    });
  };

  const handleDeleteFieldAt = (idx: number) => {
    setFields((prev) => {
      if (prev.length <= 1) return prev; // keep at least one
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  };

  /** =========================
   *  Suggestions & Generation
   *  ========================= */
  const handleGetSuggestionsWeb = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/suggest-schema-web?description=${encodeURIComponent(description)}`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setFields(result.fields.map((f: any) => ({ ...f, useAI: true })));
      setReasoning(result.global_reasoning);
      setStep(2);
    } catch (e) {
      console.error('Web Suggestion Error:', e);
      alert('Web suggestion failed. Try a different description or the AI suggestion.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/suggest-schema?description=${encodeURIComponent(description)}`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setFields(result.fields.map((f: any) => ({ ...f, useAI: true })));
      setReasoning(result.global_reasoning);
      setStep(2);
    } catch (e) {
      console.error('AI Suggestion Error:', e);
      alert('AI suggestion failed. Try the Web suggestion.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, country, rows: 20, fields }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      const generatedData: DataRow[] = Array.isArray(result) ? result : result.rows;
      setData(generatedData);

      const newHistoryItem = {
        id: Date.now().toString(),
        description: description || 'Untitled Dataset',
        timestamp: new Date().toLocaleTimeString(),
        data: generatedData,
      };
      setHistory((prev) => [newHistoryItem, ...prev]);
      setStep(3);
    } catch (e) {
      console.error('Generation Error:', e);
      alert('Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /** =========================
   *  Chart controls & processing
   *  ========================= */
  const columns = useMemo(() => (data.length ? Object.keys(data[0]) : []), [data]);

  // smart defaults based on available columns
  const [xKey, setXKey] = useState<string>('');
  const [yKey, setYKey] = useState<string>('');
  const [chartType, setChartType] = useState<ChartType>('bar');

  // detect (re)defaults whenever data changes
  useEffect(() => {
    if (columns.length === 0) {
      setXKey('');
      setYKey('');
      return;
    }
    // pick the first column for X
    const newX = columns[0] ?? '';
    // prefer a numeric column for Y, else use second column, else use X
    const numericCols = columns.filter((k) => data.some((r) => isFiniteNumber(r[k])));
    const newY = numericCols[0] ?? columns[1] ?? columns[0];
    setXKey((prev) => (prev && columns.includes(prev) ? prev : newX));
    setYKey((prev) => (prev && columns.includes(prev) ? prev : newY));
  }, [columns, data]);

  function isFiniteNumber(v: unknown): boolean {
    const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : (v as number);
    return typeof n === 'number' && Number.isFinite(n);
  }

  // Aggregate helpers
  function aggregateByX(opts: {
    rows: DataRow[];
    xKey: string;
    yKey: string;
    treatYAsCountIfNonNumeric?: boolean;
    topN?: number; // for pie or when many categories
  }) {
    const { rows, xKey, yKey, treatYAsCountIfNonNumeric = true, topN } = opts;
    const yIsNumeric = rows.some((r) => isFiniteNumber(r[yKey]));
    const map = new Map<string, number>();

    for (const row of rows) {
      const x = String(row[xKey] ?? '');
      const yRaw = row[yKey];
      const y = yIsNumeric ? Number(yRaw) : 1; // count if non-numeric
      if (!Number.isFinite(y)) continue;
      map.set(x, (map.get(x) ?? 0) + y);
    }

    let entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);

    if (typeof topN === 'number' && entries.length > topN) {
      const top = entries.slice(0, topN);
      const others = entries.slice(topN).reduce((acc, [, v]) => acc + v, 0);
      entries = [...top, ['Others', others]];
    }

    return {
      yIsNumeric,
      rows: entries.map(([name, value]) => ({ name, value })),
    };
  }

  // Build data for current chart selection
  const processed = useMemo(() => {
    if (!xKey || !yKey || data.length === 0) {
      return { forBarLine: [] as { x: string; y: number }[], forPie: [] as { name: string; value: number }[] };
    }

    if (chartType === 'pie') {
      const { rows: pieRows } = aggregateByX({
        rows: data,
        xKey,
        yKey,
        topN: 8,
      });
      return {
        forBarLine: [],
        forPie: pieRows,
      };
    }

    // bar/line
    const { rows: aggRows } = aggregateByX({
      rows: data,
      xKey,
      yKey,
      topN: 20, // constrain categories to keep it readable
    });

    const forBarLine = aggRows.map((r) => ({ x: r.name, y: r.value }));
    return { forBarLine, forPie: [] };
  }, [chartType, data, xKey, yKey]);

  const colorGrid = theme === 'dark' ? '#334155' : '#e2e8f0';
  const tooltipBg = theme === 'dark' ? '#0b1220' : '#ffffff';
  const textColor = theme === 'dark' ? '#e2e8f0' : '#0f172a';
  const blue = '#3b82f6';

  const palette = [
    '#60a5fa',
    '#34d399',
    '#fbbf24',
    '#f87171',
    '#a78bfa',
    '#22d3ee',
    '#fb7185',
    '#f59e0b',
    '#93c5fd',
    '#10b981',
  ];

  /** =========================
   *  UI
   *  ========================= */
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {/* Sidebar */}
      <Sidebar
        history={history}
        isCollapsed={sidebarIsCollapsed}
        onToggle={() => setSidebarIsCollapsed((s) => !s)}
        onSelect={(item) => {
          setData(item.data);
          setDescription(item.description);
          setStep(3);
        }}
        onDelete={(id) => setHistory((prev) => prev.filter((item) => item.id !== id))}
      />

      {/* Main content area with dynamic padding */}
      <div className={`flex-1 transition-all duration-300 ${sidebarIsCollapsed ? 'pl-20' : 'pl-64'}`}>
        <div className="p-4 md:p-8 text-slate-900 dark:text-slate-100 font-sans">
          {/* Header row */}
          <div className="flex justify-between items-center mb-8">
            <Header />

            {/* Theme slider toggle */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-full border-2 border-slate-200 dark:border-slate-800 shadow-sm">
              <Sun size={18} className={theme === 'light' ? 'text-blue-600' : 'text-slate-400'} />
              <button
                onClick={toggleTheme}
                aria-label="Toggle color theme"
                className="relative w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full transition-all duration-300"
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white dark:bg-blue-500 rounded-full shadow-sm transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <Moon size={18} className={theme === 'dark' ? 'text-blue-400' : 'text-slate-400'} />
            </div>
          </div>

          {/* Main content */}
          <main className="max-w-7xl mx-auto mt-8">
            {step === 1 && (
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm max-w-3xl mx-auto animate-in fade-in zoom-in duration-300">
                <div className="mb-8 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <label className="block text-sm font-bold text-center mb-4 text-slate-600 dark:text-slate-400 italic">
                    Select Region
                  </label>
                  <select
                    className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl mb-6 outline-none bg-white dark:bg-slate-800"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="en_GB">England</option>
                    <option value="hi_IN">India</option>
                    <option value="en_US">USA</option>
                    <option value="ja_JP">Japan</option>
                    <option value="zh_CN">China</option>
                    <option value="fr_FR">France</option>
                    <option value="de_DE">Germany</option>
                  </select>
                  <label className="block text-sm font-bold text-center mb-4 text-slate-600 dark:text-slate-400 italic">
                    Dataset Description
                  </label>
                  <textarea
                    className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl h-32 text-sm outline-none bg-white dark:bg-slate-800"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Student performance dataset..."
                  />
                </div>

                <div className="border-2 border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <div className="space-y-3 mb-0">
                    {fields.map((f, i) => (
                      <FieldCard
                        key={i}
                        index={i}
                        data={f}
                        editable={true}
                        onUpdate={(idx, key, val) => {
                          setFields((prev) => {
                            const copy = [...prev];
                            (copy[idx] as any)[key] = val;
                            return copy;
                          });
                        }}
                        onAdd={handleAddFieldAfter}
                        onDelete={handleDeleteFieldAt}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end mt-8 gap-3">
                  <button
                    onClick={handleGetSuggestionsWeb}
                    className="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-blue-300 dark:border-blue-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition text-blue-600 dark:text-blue-400"
                    disabled={loading}
                    title="Uses Wikipedia (no AI key needed)"
                  >
                    {loading ? 'Fetching…' : 'Web Suggestion (No AI)'}
                  </button>

                  <button
                    onClick={handleGetSuggestions}
                    className="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition"
                    disabled={loading}
                    title="Uses your LLM via backend"
                  >
                    {loading ? 'Thinking…' : 'AI Suggestion'}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm max-w-4xl mx-auto animate-in slide-in-from-right duration-300">
                <h2 className="text-lg font-bold text-center mb-8">Suggested field Names and description</h2>
                <div className="space-y-4 mb-8">
                  {fields.map((f, i) => (
                    <FieldCard
                      key={i}
                      index={i}
                      data={f}
                      editable={true}
                      onUpdate={(idx, key, val) => {
                        setFields((prev) => {
                          const copy = [...prev];
                          (copy[idx] as any)[key] = val;
                          return copy;
                        });
                      }}
                      onAdd={handleAddFieldAfter}
                      onDelete={handleDeleteFieldAt}
                    />
                  ))}
                </div>
                <div className="flex justify-center gap-4 mt-8">
                  <button
                    onClick={() => setStep(1)}
                    className="px-10 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition"
                  >
                    <ArrowLeft size={18} /> Back to Description
                  </button>
                  <button
                    onClick={handleGenerateData}
                    className="px-10 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition"
                  >
                    {loading ? 'Generating 20 Rows...' : (
                      <>
                        Generate and Download <Play size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
                {/* Table/Card */}
                <div className="flex-[2] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h1 className="text-xl font-bold">Editable Dataset</h1>
                    <button
                      onClick={downloadCSV}
                      className="bg-[#00c853] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-600 transition"
                    >
                      <Download size={18} /> Download CSV
                    </button>
                  </div>

                  <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 border-b-2 dark:border-slate-700">
                        <tr>
                          {data.length > 0 &&
                            Object.keys(data[0]).map((k) => (
                              <th key={k} className="p-4 font-bold border-r dark:border-slate-700">
                                {k}
                              </th>
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
                                  value={v as any as string}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setData((prev) =>
                                      prev.map((r, idx) => (idx === i ? { ...r, [k]: newValue } : r))
                                    );
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

                {/* Right column - NEW: fully controlled Chart card */}
                <aside className="flex-1 flex flex-col gap-6">
                  <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4 text-slate-800 dark:text-slate-200">Data Distribution</h3>

                    {/* Controls */}
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex flex-col">
                        <label className="text-xs mb-1 text-slate-500 dark:text-slate-400">X - axis</label>
                        <select
                          className="min-w-40 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none"
                          value={xKey}
                          onChange={(e) => setXKey(e.target.value)}
                        >
                          {columns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-xs mb-1 text-slate-500 dark:text-slate-400">Y - axis</label>
                        <select
                          className="min-w-40 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none"
                          value={yKey}
                          onChange={(e) => setYKey(e.target.value)}
                        >
                          {columns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-xs mb-1 text-slate-500 dark:text-slate-400">Chart</label>
                        <select
                          className="min-w-32 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none"
                          value={chartType}
                          onChange={(e) => setChartType(e.target.value as ChartType)}
                        >
                          <option value="bar">Bar</option>
                          <option value="line">Line</option>
                          <option value="pie">Pie</option>
                        </select>
                      </div>
                    </div>

                    {/* Chart area */}
                    <div className="h-80">
                      {data.length === 0 || !xKey || !yKey ? (
                        <div className="h-full flex items-center justify-center text-slate-400">
                          Add data or select fields to visualize.
                        </div>
                      ) : chartType === 'pie' ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                            <Tooltip
                              wrapperStyle={{ outline: 'none' }}
                              contentStyle={{
                                backgroundColor: tooltipBg,
                                border: '1px solid ' + colorGrid,
                                borderRadius: 8,
                                color: textColor,
                              }}
                              formatter={(value: any) => [value, 'Value']}
                            />
                            <Pie
                              data={processed.forPie}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={100}
                              paddingAngle={2}
                              isAnimationActive={false}
                              // No labels to avoid overlap; tooltip + legend instead
                              labelLine={false}
                            >
                              {processed.forPie.map((entry, idx) => (
                                <Cell key={`c-${idx}`} fill={palette[idx % palette.length]} />
                              ))}
                            </Pie>
                            <Legend
                              verticalAlign="bottom"
                              wrapperStyle={{
                                color: textColor,
                                paddingTop: 10,
                                maxHeight: 90,
                                overflowY: 'auto',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <BarChart
                              data={processed.forBarLine}
                              margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colorGrid} />
                              <XAxis
                                dataKey="x"
                                tick={{ fontSize: 10, fill: textColor }}
                                interval="preserveEnd"
                                height={40}
                                tickLine={false}
                                axisLine={{ stroke: colorGrid }}
                              />
                              <YAxis
                                tick={{ fontSize: 10, fill: textColor }}
                                tickLine={false}
                                axisLine={{ stroke: colorGrid }}
                              />
                              <Tooltip
                                wrapperStyle={{ outline: 'none' }}
                                contentStyle={{
                                  backgroundColor: tooltipBg,
                                  border: '1px solid ' + colorGrid,
                                  borderRadius: 8,
                                  color: textColor,
                                }}
                                formatter={(value: any) => [value, yKey]}
                                labelFormatter={(label) => `${xKey}: ${label}`}
                              />
                              <Bar dataKey="y" fill={blue} radius={[4, 4, 0, 0]} />
                            </BarChart>
                          ) : (
                            <LineChart
                              data={processed.forBarLine}
                              margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colorGrid} />
                              <XAxis
                                dataKey="x"
                                tick={{ fontSize: 10, fill: textColor }}
                                interval="preserveEnd"
                                height={40}
                                tickLine={false}
                                axisLine={{ stroke: colorGrid }}
                              />
                              <YAxis
                                tick={{ fontSize: 10, fill: textColor }}
                                tickLine={false}
                                axisLine={{ stroke: colorGrid }}
                              />
                              <Tooltip
                                wrapperStyle={{ outline: 'none' }}
                                contentStyle={{
                                  backgroundColor: tooltipBg,
                                  border: '1px solid ' + colorGrid,
                                  borderRadius: 8,
                                  color: textColor,
                                }}
                                formatter={(value: any) => [value, yKey]}
                                labelFormatter={(label) => `${xKey}: ${label}`}
                              />
                              <Line
                                type="monotone"
                                dataKey="y"
                                stroke={blue}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                              />
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                  >
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
