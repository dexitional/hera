import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Search, Edit2, Trash2, FolderTree, 
  Filter, ChevronDown, Hash, Users, ArrowUpDown 
} from "lucide-react";

interface CategoryRecord {
  id: number;
  eventId: number;
  eventTitle: string;    // Joined from 'events' table context
  name: string;          // e.g. "Artist of the Year"
  description: string;
  code: string;          // 4-digit unique verification shortcode
  order: number;         // Layout UI sorting weights
  contestantsCount: number; // Aggregated relational count from 'contestants' table
}

export const Route = createFileRoute("/admin/categories/")({
  component: CategoriesDirectory,
});

const INITIAL_CATEGORIES: CategoryRecord[] = [
  {
    id: 1,
    eventId: 10,
    eventTitle: "2026 National Music Awards",
    name: "Artist of the Year",
    description: "The ultimate tier recognizing exceptional artistic output and public commercial appeal.",
    code: "8F3A",
    order: 1,
    contestantsCount: 6,
  },
  {
    id: 2,
    eventId: 10,
    eventTitle: "2026 National Music Awards",
    name: "Best Rapper of the Year",
    description: "Honouring lyricism, structure, delivery, and rhythmic timing efficiency.",
    code: "2K9P",
    order: 2,
    contestantsCount: 5,
  },
  {
    id: 3,
    eventId: 11,
    eventTitle: "Inter-University Rap Battle Arena",
    name: "Lightweight Freestyle Tier",
    description: "Introductory sudden death elimination brackets for newly registered colleges.",
    code: "5X1Z",
    order: 1,
    contestantsCount: 16,
  },
];

function CategoriesDirectory() {
  const [categories, setCategories] = useState<CategoryRecord[]>(INITIAL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>("ALL");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu automatically on outer mouse actions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter pipeline handling criteria changes dynamically
  const filteredCategories = categories.filter((category) => {
    const matchesSearch = 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedEventFilter === "ALL" || category.eventTitle === selectedEventFilter;
    return matchesSearch && matchesFilter;
  });

  const handleEditCategory = (id: number) => {
    console.log("Invoking edit wizard hook parameters for category entry:", id);
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm("Are you sure you want to delete this category? This operation cascades and drops all enrolled contestants and corresponding votes cast!")) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      console.log(`Dropped category index: ${id}`);
    }
  };

  // Extract unique parent events list for dropdown filter construction
  const parentEvents = ["ALL", ...Array.from(new Set(categories.map(c => c.eventTitle)))];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ================= HEADER OVERVIEW PANEL ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-purple-400" />
              <span>Event Categories Registry</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Organize structural ballot sectors, audit unique 4-digit interaction codes, adjust sorting layouts, and monitor registered contestant densities.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/admin/categories/new"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
            </Link>
          </div>
        </div>

        {/* ================= FILTER CONFIGURATION BAR ================= */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 relative z-30">
          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search category name or 4-digit code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
          </div>

          {/* Dynamic Event Filter Dropdown */}
          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className={`w-full sm:w-64 flex items-center justify-between gap-2 text-xs font-semibold px-4 py-2 rounded-lg border bg-[#0a192a]/50 text-zinc-300 transition-all focus:outline-none ${isFilterDropdownOpen ? "border-purple-500 ring-2 ring-purple-500/20" : "border-zinc-800 hover:border-zinc-700"}`}
            >
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-500 font-normal">Scope:</span>
                <span className="text-white truncate">{selectedEventFilter === "ALL" ? "All Parent Events" : selectedEventFilter}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${isFilterDropdownOpen ? "transform rotate-180" : ""}`} />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-full sm:w-64 rounded-lg border border-zinc-800 bg-[#0a192a]/50 p-1 shadow-2xl z-50 overflow-hidden divide-y divide-zinc-900 block animate-in fade-in slide-in-from-top-1 duration-100">
                {parentEvents.map((evt) => (
                  <button
                    key={evt}
                    type="button"
                    onClick={() => {
                      setSelectedEventFilter(evt);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white flex items-center justify-between ${selectedEventFilter === evt ? "bg-zinc-900 text-purple-400 font-semibold" : "text-zinc-400"}`}
                  >
                    <span className="truncate pr-2">{evt === "ALL" ? "All Parent Events" : evt}</span>
                    {selectedEventFilter === evt && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================= DATAGRID DIRECTORY MATRIX ================= */}
        <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Category Meta Framework</th>
                  <th className="px-6 py-4">Parent Event Mapping</th>
                  <th className="px-6 py-4 text-center">Contestant Density</th>
                  <th className="px-6 py-4 text-center">Menu Token</th>
                  <th className="px-6 py-4 text-center">Sorting weight</th>
                  <th className="px-6 py-4 text-right">Action Blocks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-zinc-900/20 transition-colors group">
                      
                      {/* Column 1: Title & Text Description */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white tracking-wide text-sm">{category.name}</span>
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                            {category.description}
                          </p>
                        </div>
                      </td>

                      {/* Column 2: Parent Event Context Identity (Joined) */}
                      <td className="px-6 py-4 align-middle">
                        <span className="text-zinc-300 text-xs bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md block w-max max-w-xs truncate">
                          {category.eventTitle}
                        </span>
                      </td>

                      {/* Column 3: Total Enrolled Contestants (Aggregated Badge) */}
                      <td className="px-6 py-4 align-middle text-center">
                        <div className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded shadow-inner">
                          <Users className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{category.contestantsCount}</span>
                          <span className="text-[10px] text-zinc-500 font-sans font-normal ml-0.5">
                            {category.contestantsCount === 1 ? "Profile" : "Profiles"}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: 4-Digit Unique Menu Code String Verification Key */}
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="font-mono text-xs font-bold bg-zinc-900 border border-zinc-800 text-purple-400 px-2 py-1 rounded select-all">
                          {category.code}
                        </span>
                      </td>

                      {/* Column 5: Sequential UI Sorting Order Weight Number */}
                      <td className="px-6 py-4 align-middle text-center font-mono text-xs text-zinc-400">
                        <div className="inline-flex items-center gap-1 justify-center">
                          <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                          <span>{category.order}</span>
                        </div>
                      </td>

                      {/* Column 6: Administrative Row Modifications Overrides */}
                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditCategory(category.id)}
                            title="Modify Profile Parameters"
                            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            title="Delete and Cascade Drop"
                            className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-500 text-xs border border-dashed border-zinc-900 rounded-b-xl">
                      No category partitions detected matching selected filtering scopes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
}
