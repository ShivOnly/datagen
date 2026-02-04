export default function Header() {
  return (
    <header className="mb-12 text-center transition-all duration-500 ease-in-out">
      {/* Premium Badge: Optimized for light/dark visibility */}
      <div className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-full shadow-sm">
       Data Generator
      </div>
      
      {/* Main Title: Uses high-contrast slates for professional clarity */}
      <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
        DataSynth<span className="text-blue-600 dark:text-blue-500">.RAG</span>
      </h1>
      
      {/* Subtext: Carefully balanced gray for readability on white vs. slate-950 */}
      <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Generate high-fidelity synthetic datasets for you using local <span className="font-semibold text-slate-800 dark:text-slate-200">RAG technology</span>.
      </p>
    </header>
  );
}