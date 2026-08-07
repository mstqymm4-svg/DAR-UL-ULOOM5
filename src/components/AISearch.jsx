import { Sparkles } from "lucide-react";
import { useState } from "react";

// Local, fully offline keyword search over the already-loaded books list.
// Replaces the previous Base44 LLM-powered search — no AI/cloud service
// is used here.
export default function AISearch({ books, onResults, onClear }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(false);

  const handleSearch = () => {
    const term = query.trim().toLowerCase();
    if (!term) return;
    setActive(true);

    const matched = books.filter((b) => {
      const haystack = [b.title, b.author, b.category, b.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });

    onResults(matched, `نتائج البحث عن: "${query}"`);
  };

  const handleClear = () => {
    setQuery("");
    setActive(false);
    onClear();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ابحث عن كتاب بالعنوان أو المؤلف أو التصنيف..."
          className="flex-1 h-10 px-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={active ? handleClear : handleSearch}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {active ? "مسح" : "بحث"}
        </button>
      </div>
      {active && (
        <div className="flex items-center gap-1.5 mt-2">
          <Sparkles className="w-3 h-3 text-accent" />
          <span className="text-xs text-muted-foreground">البحث نشط</span>
        </div>
      )}
    </div>
  );
}
