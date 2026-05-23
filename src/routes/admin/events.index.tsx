import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Search, Edit2, Trash2, Sliders, 
  Sparkles, Filter, ChevronDown, CheckCircle, XCircle, FolderTree, Coins, DollarSign 
} from "lucide-react";

interface EventRecord {
  id: number;
  title: string;
  description: string;
  unitPrice: number;        // doublePrecision map from schema
  paymentAmount: number;    // doublePrecision total collected from Paystack
  paymentDeduction: number; // doublePrecision platform fee deduction
  isActive: number;         // integer mapping: 1 = Active, 0 = Disabled
  orgId: number;
  orgName: string;          // Joined from 'organizations' table context
  categoriesCount: number;  // Aggregated relational count
}

export const Route = createFileRoute("/admin/events/")({
  component: EventsDirectory,
});

const INITIAL_EVENTS: EventRecord[] = [
  {
    id: 1,
    title: "2026 National Music Awards",
    description: "Annual Public Music Industry voting and award event.",
    unitPrice: 1.50, // GHS 1.50 per vote code block entry
    paymentAmount: 45200.00, // Accumulated gross revenue metrics via Paystack subaccount
    paymentDeduction: 4520.00,
    isActive: 1,
    orgId: 1,
    orgName: "Festora Global Studios",
    categoriesCount: 24,
  },
  {
    id: 2,
    title: "Inter-University Rap Battle Arena",
    description: "High-concurrency college campus rap contest platform.",
    unitPrice: 0.50, // GHS 0.50 per vote
    paymentAmount: 12450.50,
    paymentDeduction: 1245.05,
    isActive: 1,
    orgId: 1,
    orgName: "Capevars.com",
    categoriesCount: 8,
  },
  {
    id: 3,
    title: "Community Heritage Talent Search",
    description: "Concluded regional cultural presentation polls.",
    unitPrice: 1.00, // GHS 1.00 per vote
    paymentAmount: 8900.00,
    paymentDeduction: 890.00,
    isActive: 0,
    orgId: 2,
    orgName: "National Entertainment Council",
    categoriesCount: 5,
  },
];

function EventsDirectory() {
  const [events, setEvents] = useState<EventRecord[]>(INITIAL_EVENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DISABLED">("ALL");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      event.orgName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "ACTIVE") return matchesSearch && event.isActive === 1;
    if (statusFilter === "DISABLED") return matchesSearch && event.isActive === 0;
    return matchesSearch;
  });

  const handleEditEvent = (id: number) => {
    console.log("Navigating to setup wizard for event ID:", id);
  };

  const handleDeleteEvent = (id: number) => {
    if (confirm("Are you sure you want to delete this event? This action will permanently drop all nested categories, contestants, and premium votes cast under this record cascade!")) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Public Events Manager</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Initialize public high-concurrency voting platforms, allocate USSD shorthand codes, and track multi-tenant revenue metrics.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/admin/events/new"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Voting Event</span>
            </Link>
          </div>
        </div>

        {/* ================= BAR FILTERS & QUICK SEARCH ================= */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 relative z-30">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by title or hosting org..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className={`w-full sm:w-48 flex items-center justify-between gap-2 text-xs font-semibold px-4 py-2 rounded-lg border bg-[#0a192a]/50 text-zinc-300 transition-all focus:outline-none ${isFilterDropdownOpen ? "border-purple-500 ring-2 ring-purple-500/20" : "border-zinc-800 hover:border-zinc-700"}`}
            >
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-500 font-normal">State:</span>
                <span className="text-white truncate uppercase text-[11px] font-bold">{statusFilter}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${isFilterDropdownOpen ? "transform rotate-180" : ""}`} />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-full sm:w-48 rounded-lg border border-zinc-800 bg-[#0a192a]/50 p-1 shadow-2xl z-50 overflow-hidden divide-y divide-zinc-900 block animate-in fade-in slide-in-from-top-1 duration-100">
                {(["ALL", "ACTIVE", "DISABLED"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setStatusFilter(filter);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white flex items-center justify-between ${statusFilter === filter ? "bg-zinc-900 text-purple-400 font-semibold" : "text-zinc-400"}`}
                  >
                    <span>{filter === "ALL" ? "All Platforms" : filter === "ACTIVE" ? "Active (Live)" : "Disabled (Closed)"}</span>
                    {statusFilter === filter && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Event Display Identity</th>
                  <th className="px-6 py-4">Ownership Workspace</th>
                  <th className="px-6 py-4 text-center">Categories</th>
                  <th className="px-6 py-4 text-center">Price</th>
                  <th className="px-6 py-4 text-right">Paystack Collected</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Console Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-zinc-900/20 transition-colors group">
                      
                      {/* Column 1: Event Title */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white tracking-wide text-sm">{event.title}</span>
                          <span className="text-[10px] text-zinc-500 font-mono mt-1 font-bold">
                            DB_REF: ev_node_{event.id}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Bound Organization Profile */}
                      <td className="px-6 py-4 align-middle">
                        <span className="text-zinc-300 text-xs bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md block w-max max-w-xs truncate">
                          {event.orgName}
                        </span>
                      </td>

                      {/* Column 3: Total Categories (Aggregated) */}
                      <td className="px-6 py-4 align-middle text-center">
                        <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-purple-400 px-2.5 py-1 rounded shadow-inner">
                          <FolderTree className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{event.categoriesCount}</span>
                        </div>
                      </td>

                      {/* Column 4: Unit Price Per Vote Field (New Schema Variable) */}
                      <td className="px-6 py-4 align-middle text-center">
                        <div className="inline-flex items-center gap-1 text-xs font-mono font-bold text-zinc-300 bg-zinc-900/60 border border-zinc-800/40 px-2 py-1 rounded">
                          <Coins className="w-3 h-3 text-amber-500" />
                          <span>₵{event.unitPrice.toFixed(2)}</span>
                        </div>
                      </td>

                      {/* Column 5: Payment Amount Collected via Paystack (New Schema Variable) */}
                      <td className="px-6 py-4 align-middle text-right font-mono text-xs font-semibold text-emerald-400">
                        <div className="flex items-center justify-end gap-0.5">
                          <DollarSign className="w-3.5 h-3.5 text-zinc-600" />
                          <span>₵{event.paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </td>

                      {/* Column 6: Lifecycle Status */}
                      <td className="px-6 py-4 align-middle text-center">
                        <div className="inline-flex justify-center">
                          {event.isActive === 1 ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3 animate-pulse" /> Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" /> Closed
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 7: Management Action Ribbon */}
                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-3">
                          
                          <Link
                            to={`/admin/events`}
                            className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
                          >
                            <Sliders className="w-3 h-3 text-purple-400" />
                            <span>Manage</span>
                          </Link>

                          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
                            <button
                              onClick={() => handleEditEvent(event.id)}
                              title="Edit Settings"
                              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              title="Delete Event Instance"
                              className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-zinc-500 text-xs border border-dashed border-zinc-900 rounded-b-xl">
                      No public events detected matching sorting filters.
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
