'use client';

import { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, STYLES, type Category, type Style } from '@/lib/server/styles-data';

export { STYLES };

const TAG_COLORS: Record<Style['tagColor'], string> = {
  popular:  'bg-morphix-purple/20 text-morphix-purple',
  trending: 'bg-morphix-magenta/20 text-morphix-magenta',
  new:      'bg-morphix-green/20 text-morphix-green',
  hot:      'bg-orange-500/20 text-orange-400',
  clean:    'bg-sky-500/20 text-sky-400',
  soft:     'bg-pink-400/20 text-pink-300',
  moody:    'bg-slate-500/20 text-slate-300',
  retro:    'bg-amber-500/20 text-amber-400',
  dreamy:   'bg-violet-400/20 text-violet-300',
  bold:     'bg-red-500/20 text-red-400',
  dark:     'bg-zinc-600/20 text-zinc-300',
  surreal:  'bg-cyan-500/20 text-cyan-400',
};

interface StyleSelectorProps {
  value: string | null;
  onChange: (styleId: string) => void;
}

export default function StyleSelector({ value, onChange }: StyleSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<Category | 'All' | 'Favorites'>('All');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hasLoadedFavorites, setHasLoadedFavorites] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('style_favorites');
      const parsed = raw ? JSON.parse(raw) : [];
      setFavorites(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []);
    } catch (e) {
      setFavorites([]);
    } finally {
      setHasLoadedFavorites(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedFavorites) return;
    try {
      localStorage.setItem('style_favorites', JSON.stringify(favorites));
    } catch (e) {
      // ignore
    }
  }, [favorites, hasLoadedFavorites]);

  const filtered = useMemo(() => {
    return STYLES.filter((s) => {
      const catMatch =
        activeCategory === 'All' ||
        (activeCategory === 'Favorites' ? favorites.includes(s.id) : s.category === activeCategory);
      const q = search.toLowerCase();
      const textMatch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.promptHint.toLowerCase().includes(q) ||
        s.tag.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [activeCategory, search, favorites]);

  const selected = STYLES.find((s) => s.id === value);

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-morphix-purple/60 pointer-events-none"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search styles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-ink-800 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-morphix-purple/60 transition-colors"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {(['All', 'Favorites', ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as any)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat
                ? 'bg-morphix-purple text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-white/30">
        {filtered.length} style{filtered.length !== 1 ? 's' : ''}
        {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
        {search ? ` matching "${search}"` : ''}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[680px] overflow-y-auto pr-1 scrollbar-thin">
        {filtered.map((style) => {
          const isActive = value === style.id;
          const isFav = favorites.includes(style.id);
          return (
            <div
              key={style.id}
              role="button"
              tabIndex={0}
              onClick={() => onChange(style.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(style.id); } }}
              className={`relative group flex flex-col gap-3 p-4 rounded-2xl text-left transition-all duration-200 overflow-hidden ${
                isActive
                  ? 'ring-2 ring-morphix-purple/50 shadow-[0_8px_40px_rgba(139,104,255,0.06)] bg-gradient-to-b from-white/2 to-white/1'
                  : 'bg-ink-800 hover:scale-[1.02] hover:shadow-lg'
              }`}
            >
              {/* Favorite toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFavorites((prev) =>
                    prev.includes(style.id)
                      ? prev.filter((id) => id !== style.id)
                      : [style.id, ...prev],
                  );
                }}
                aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
                aria-pressed={isFav}
                className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                {isFav ? (
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-yellow-300" fill="currentColor">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Gradient swatch */}
              <div
                className="w-full h-28 rounded-xl flex-shrink-0 opacity-95 transition-all"
                style={{ background: style.gradient }}
              />

              {/* Tag */}
              <span
                className={`absolute top-4 right-4 text-[11px] font-semibold px-2 py-1 rounded-full ${
                  TAG_COLORS[style.tagColor]
                }`}
              >
                {style.tag}
              </span>

              {/* Name */}
              <span className="text-sm md:text-base font-semibold text-white leading-tight">
                {style.name}
              </span>

              {/* Description */}
              <span className="text-[12px] text-white/40 leading-snug line-clamp-2">
                {style.description}
              </span>

              {/* Active checkmark */}
              {isActive && (
                <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-morphix-purple flex items-center justify-center">
                  <svg viewBox="0 0 12 12" fill="none" className="w-4 h-4" stroke="white" strokeWidth="2">
                    <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-white/30 text-sm">
            No styles match your search.
          </div>
        )}
      </div>

      {/* Selected summary */}
      {selected && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-morphix-purple/10 border border-morphix-purple/25">
          <div
            className="w-8 h-8 rounded-lg flex-shrink-0"
            style={{ background: selected.gradient }}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white">{selected.name}</span>
            <span className="text-[11px] text-white/40 truncate">{selected.description}</span>
          </div>
          <span className="ml-auto text-[10px] text-white/25 font-mono truncate max-w-[120px]">
            {selected.category}
          </span>
        </div>
      )}
    </div>
  );
}
