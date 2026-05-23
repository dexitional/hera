import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpDown,
  Award,
  ChevronDown,
  Edit2,
  Filter,
  Flame,
  Layers,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ContestantRecord {
  id: number;
  categoryId: number;
  categoryName: string; // Joined from 'categories' table context
  name: string; // e.g. "Stonebwoy"
  tagline: string; // e.g. "Defending Reggae/Dancehall Pioneer"
  code: string; // 4-digit unique numeric ballot key
  order: number; // sequential sorting index position
  totalVotes: number; // Aggregated count mapping sum(votes.vote_count)
}

export const Route = createFileRoute("/admin/contestants/")({
  component: ContestantsDirectory,
});

const INITIAL_CONTESTANTS: ContestantRecord[] = [
  {
    id: 1,
    categoryId: 50,
    categoryName: "Artist of the Year",
    name: "Stonebwoy",
    tagline:
      "Defending Reggae/Dancehall Pioneer and international chart-topper.",
    code: "4829",
    order: 1,
    totalVotes: 14502,
  },
  {
    id: 2,
    categoryId: 50,
    categoryName: "Artist of the Year",
    name: "Sarkodie",
    tagline:
      "Decorated African rap icon with unprecedented flow delivery metrics.",
    code: "7105",
    order: 2,
    totalVotes: 12840,
  },
  {
    id: 3,
    categoryId: 51,
    categoryName: "Best Rapper of the Year",
    name: "M.anifest",
    tagline: "Premium wordplay lyricist and pan-African structural composer.",
    code: "3092",
    order: 1,
    totalVotes: 8930,
  },
];

function ContestantsDirectory() {
  const [contestants, setContestants] =
    useState<ContestantRecord[]>(INITIAL_CONTESTANTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("ALL");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu wrapper instantly on outer mouse actions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter pipeline execution sorting out grid elements dynamically
  const filteredContestants = contestants.filter((contestant) => {
    const matchesSearch =
      contestant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contestant.code.includes(searchQuery);

    const matchesFilter =
      selectedCategoryFilter === "ALL" ||
      contestant.categoryName === selectedCategoryFilter;
    return matchesSearch && matchesFilter;
  });

  const handleEditContestant = (id: number) => {
    console.log("Invoking edit wizard hook parameters for contestant row:", id);
  };

  const handleDeleteContestant = (id: number) => {
    if (
      confirm(
        "Are you sure you want to disqualify or drop this contestant permanently? This action drops correlated cast totals!",
      )
    ) {
      setContestants((prev) => prev.filter((c) => c.id !== id));
      console.log(`Dropped contestant database footprint index: ${id}`);
    }
  };

  // Dynamically group distinct classifications to seed the dropdown filter options
  const categoryOptions = [
    "ALL",
    ...Array.from(new Set(contestants.map((c) => c.categoryName))),
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span>Ballot Contestants Directory</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Audit enrolled participants, review live verified vote
              accumulation metrics, test 4-digit interaction codes, and handle
              structural list ordering.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/admin/contestants/new"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-md transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Contestant</span>
            </Link>
          </div>
        </div>

        {/* ================= FILTER MANAGEMENT CONFIGURATION BAR ================= */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 relative z-30">
          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search contestant name or 4-digit code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
          </div>

          {/* Custom Category Dropdown Filter Selector */}
          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className={`w-full sm:w-64 flex items-center justify-between gap-2 text-xs font-semibold px-4 py-2 rounded-lg border bg-[#0a192a]/50 text-zinc-300 transition-all focus:outline-none ${isFilterDropdownOpen ? "border-purple-500 ring-2 ring-purple-500/20" : "border-zinc-800 hover:border-zinc-700"}`}
            >
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-500 font-normal">Category:</span>
                <span className="text-white truncate">
                  {selectedCategoryFilter === "ALL"
                    ? "All App Categories"
                    : selectedCategoryFilter}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${isFilterDropdownOpen ? "transform rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Box Options */}
            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-full sm:w-64 rounded-lg border border-zinc-800 bg-[#0a192a]/50 p-1 shadow-2xl z-50 overflow-hidden divide-y divide-zinc-900 block animate-in fade-in slide-in-from-top-1 duration-100">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter(cat);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white flex items-center justify-between ${selectedCategoryFilter === cat ? "bg-zinc-900 text-purple-400 font-semibold" : "text-zinc-400"}`}
                  >
                    <span className="truncate pr-2">
                      {cat === "ALL" ? "All App Categories" : cat}
                    </span>
                    {selectedCategoryFilter === cat && (
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
                  <th className="px-6 py-4">Contestant Identity Node</th>
                  <th className="px-6 py-4">Assigned Category Tier</th>
                  <th className="px-6 py-4 text-center">4-Digit Code</th>
                  <th className="px-6 py-4 text-center">Sorting weight</th>
                  <th className="px-6 py-4 text-right">Votes Accumulated</th>
                  <th className="px-6 py-4 text-right">Actions Overrides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {filteredContestants.length > 0 ? (
                  filteredContestants.map((contestant) => (
                    <tr
                      key={contestant.id}
                      className="hover:bg-zinc-900/20 transition-colors group"
                    >
                      {/* Column 1: Name, ID and biographical Tagline Hook phrase */}
                      <td className="px-6 py-4 max-w-xs md:max-w-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white tracking-wide text-sm">
                            {contestant.name}
                          </span>
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                            {contestant.tagline}
                          </p>
                        </div>
                      </td>

                      {/* Column 2: Relational Parent Category (Joined) */}
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="text-zinc-300 text-xs bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md block truncate max-w-[160px]">
                            {contestant.categoryName}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Secure unique 4-Digit Ballot Selection code */}
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="font-mono text-xs font-bold bg-zinc-900 border border-zinc-800 text-purple-400 px-2 py-1 rounded select-all shadow-sm tracking-widest">
                          {contestant.code}
                        </span>
                      </td>

                      {/* Column 4: List sorting layout order index number */}
                      <td className="px-6 py-4 align-middle text-center font-mono text-xs text-zinc-500">
                        <div className="inline-flex items-center gap-1 justify-center">
                          <ArrowUpDown className="w-3 h-3 text-zinc-700" />
                          <span>{contestant.order}</span>
                        </div>
                      </td>

                      {/* Column 5: Live relational sum(vote_count) column metadata metric */}
                      <td className="px-6 py-4 align-middle text-right font-mono text-sm font-bold text-white">
                        <div className="flex items-center justify-end gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span>{contestant.totalVotes.toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Column 6: Administrative Row Modifiers */}
                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditContestant(contestant.id)}
                            title="Modify Contestant Parameters"
                            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteContestant(contestant.id)
                            }
                            title="Disqualify/Delete Profile"
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
                    <td
                      colSpan={6}
                      className="text-center py-12 text-zinc-500 text-xs border border-dashed border-zinc-900 rounded-b-xl"
                    >
                      No contestant nodes detected matching selected filtering
                      parameters.
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
