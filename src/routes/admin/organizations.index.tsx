import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { 
  Building2, Plus, Search, Sliders, Edit2, 
  Trash2, Mail, Phone, Shield, User, Image as ImageIcon 
} from "lucide-react";

interface OrganizationRecord {
  id: number;
  name: string;
  imageUrl: string | null;
  email: string;
  phone: string;
  adminId: string;
  adminName: string; // Joined from 'user' table context via Better Auth
}

export const Route = createFileRoute("/admin/organizations/")({
  component: OrganizationsDirectory,
});

// Mock initial dataset matching the structure of your organizations Drizzle schema
const INITIAL_ORGANIZATIONS: OrganizationRecord[] = [
  {
    id: 1,
    name: "Festora Global Studios",
    imageUrl: "https://festora-storage.internal",
    email: "ops@festora.com",
    phone: "+233240001111",
    adminId: "usr_cl7w9x8120000jk8s9zxx41p0",
    adminName: "John Doe",
  },
  {
    id: 2,
    name: "Capevars.com",
    imageUrl: null, // Testing graphical fallback state rules
    email: "admin@capevars.com",
    phone: "+233201234567",
    adminId: "usr_cl7w9x8120000jk8s9zxx41p0",
    adminName: "John Doe",
  },
  {
    id: 3,
    name: "National Entertainment Council",
    imageUrl: "",
    email: "contact@nec.gov.gh",
    phone: "+233559876543",
    adminId: "usr_cl9z2m4150000ab8s7yxx99p1",
    adminName: "Kwame Mensah",
  },
];

function OrganizationsDirectory() {
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>(INITIAL_ORGANIZATIONS);
  const [searchQuery, setSearchQuery] = useState("");

  // Simulated active user context from Better Auth (for quick ownership highlighting)
  const currentSessionUser = {
    id: "usr_cl7w9x8120000jk8s9zxx41p0"
  };

  // Processing search criteria filters reactively over database string fields
  const filteredOrganizations = organizations.filter((org) => {
    return (
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.phone.includes(searchQuery)
    );
  });

  const handleEditOrganization = (id: number) => {
    console.log("Invoking configuration update wizard routing trace for organization index:", id);
  };

  const handleDeleteOrganization = (id: number) => {
    if (confirm("Are you sure you want to completely delete this organization? This destructive operation cascades and permanently drops all nested events, elections, categories, and payment tokens!")) {
      setOrganizations((prev) => prev.filter((org) => org.id !== id));
      console.log(`Dropped organization record footprint trace index: ${id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ================= PROJECT CONTROL HEADER BAR ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-purple-400" />
              <span>Multi-Tenant Workspaces</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Provision independent organizational groups, bind communication layers, assign Better Auth administrative access keys, and review cross-tenant event modules.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/admin/organizations/new"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-md transition-all font-sans"
            >
              <Plus className="w-4 h-4" />
              <span>New Organization</span>
            </Link>
          </div>
        </div>

        {/* ================= FILTER MANAGEMENT SEARCHBAR ================= */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 relative z-30">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search workspaces by name, email, or telephone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-xs text-zinc-500 font-medium select-none">
            Showing {filteredOrganizations.length} active node workspaces
          </div>
        </div>

        {/* ================= DATAGRID DIRECTORY RECORDS TABLE ================= */}
        <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Workspace Branding Profile</th>
                  <th className="px-6 py-4">Administrative Identity</th>
                  <th className="px-6 py-4">System Contact Email</th>
                  <th className="px-6 py-4">Telephone Routing Matrix</th>
                  <th className="px-6 py-4 text-right">Console Access Ribbon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {filteredOrganizations.length > 0 ? (
                  filteredOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-zinc-900/20 transition-colors group">
                      
                      {/* Column 1: Image Avatar and Title String */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                            {org.imageUrl ? (
                              <img 
                                src={org.imageUrl} 
                                alt={org.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <Building2 className="w-4 h-4 text-zinc-600" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-white tracking-wide text-sm truncate max-w-[200px]">{org.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono mt-0.5 select-all">org_ref: node_idx_{org.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Better Auth adminId Ownership Context */}
                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                            <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span>{org.adminName}</span>
                            {org.adminId === currentSessionUser.id && (
                              <span className="text-[9px] uppercase font-black bg-purple-950/40 border border-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-sm select-none">
                                Owner
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[140px] mt-1 select-all" title={org.adminId}>
                            {org.adminId}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Contact Email (Unique constraint index check) */}
                      <td className="px-6 py-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                          <Mail className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                          <a href={`mailto:${org.email}`} className="hover:text-purple-400 transition-colors select-all">
                            {org.email}
                          </a>
                        </div>
                      </td>

                      {/* Column 4: Contact Phone (Unique index constraint check) */}
                      <td className="px-6 py-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                          <Phone className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                          <span className="select-all">{org.phone}</span>
                        </div>
                      </td>

                      {/* Column 5: Action Triggers (Manage console hubs vs Overrides) */}
                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-3">
                          
                          {/* Main Control Console Router Path Trigger anchor */}
                          <Link
                            to={`/admin/organizations`}
                            className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm select-none"
                          >
                            <Sliders className="w-3 h-3 text-purple-400" />
                            <span>Console</span>
                          </Link>

                          {/* Secondary structural configuration modifications */}
                          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
                            <button
                              onClick={() => handleEditOrganization(org.id)}
                              title="Edit Workspace Settings"
                              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrganization(org.id)}
                              title="Delete Workspace Node"
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
                    <td colSpan={5} className="text-center py-12 text-zinc-500 text-xs border border-dashed border-zinc-900 rounded-b-xl">
                      No operational workspaces found matching search validation queries.
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
