import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import React, { useState } from "react";
import { 
  UserPlus, Upload, Search, Edit2, Trash2, 
  CheckCircle, XCircle, FileSpreadsheet, X, 
  Loader2,
  Smartphone,
  MessageCircleWarning,
  PhoneForwarded,
  PhoneCallIcon
} from "lucide-react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { deleteVoterFn, exportVotersToExcelFn, getVotersByElectionFn, inviteVoterFn, inviteVotersFn, uploadVotersFn } from "#/server/tenant-elections";
import * as XLSX from 'xlsx';
import { addCountryCode, generateSixDigitCode } from "#/lib/utils";


const electionsQueryOptions = (electionId: any) => ({
  queryKey: ['voters-admin'],
  queryFn: () => getVotersByElectionFn({ data: electionId }),
});


export const Route = createFileRoute("/admin/elections/$electionId/voters/")({
  component: VotersDirectory,
  loader: async ({ context,params }) => {
    const { electionId } = params; 
    await context.queryClient.ensureQueryData(electionsQueryOptions(electionId));
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});



function VotersDirectory() {
  
  const queryClient = useQueryClient();
  const { electionId } = Route.useParams(); 
  const { data }:any = useSuspenseQuery(electionsQueryOptions(electionId));
  const [isExporting, setIsExporting] = useState(false);
  
  const voters:any = data?.map((r: any) => ({ 
    id: r?.voters?.id,
    name: r?.voters?.name,
    username: r?.voters?.username,
    phoneNumber: r?.voters?.phoneNumber,
    isActive: r?.voters?.isActive,
    email: r?.voters?.email,
    inviteToken: r?.voters?.inviteToken,
    isVerified: r?.voters?.isVerified,
    hasVoted: r?.voters?.hasVoted,
  }))


  
  // const [voters, setVoters] = useState<VoterRecord[]>(INITIAL_VOTERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VOTED" | "PENDING">("ALL");
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);

  // Filter Logic execution pipeline
  const filteredVoters = voters?.filter((voter: any) => {
    const matchesSearch = 
      voter?.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
      voter?.email?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
      voter?.username?.toLowerCase().includes(searchQuery?.toLowerCase());
    
    if (statusFilter === "VOTED") return matchesSearch && voter.hasVoted;
    if (statusFilter === "PENDING") return matchesSearch && !voter.hasVoted;
    return matchesSearch;
  });

  

  const deleteMutation = useMutation({
    mutationFn: deleteVoterFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters-admin'] });
      return redirect({ to: `/admin/elections/${electionId}/voters` } as any)
    },
    onError: (error: any) => console.error(error.message)
  });

  const inviteMutation = useMutation({
    mutationFn: inviteVoterFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters-admin'] });
      return redirect({ to: `/admin/elections/${electionId}/voters` } as any)
    },
    onError: (error: any) => console.error(error.message)
  });

  const invitesMutation = useMutation({
    mutationFn: inviteVotersFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters-admin'] });
      return redirect({ to: `/admin/elections/${electionId}/voters` } as any)
    },
    onError: (error: any) => console.error(error.message)
  });

  const importExcelMutation = useMutation({
    mutationFn: uploadVotersFn,
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['voters-admin'] });
      if (result?.message) alert(result.message);
      return redirect({ to: `/admin/elections/${electionId}/voters` } as any);
    },
    onError: (error: any) => {
      console.error(error.message);
      alert(error?.message || "Voter import failed");
    },
  });



  const handleDeleteVoter = (id: any) => {
    if (confirm("Are you sure you want to remove this voter? Removing this will cascade and affect voter's ballot!")) {
       deleteMutation.mutate({ data: id });
    }
  };

  const handleInviteVoter = (id: any) => {
    if (confirm("Invite this voter ?")) {
      inviteMutation.mutate({ data: id });
    }
  };

  const handleInviteVoters = () => {
    if (confirm("Send multiple invitations ?")) {
      invitesMutation.mutate({ data: electionId } as any);
    }
  };


  const handleExportToExcel = async () => {
      try {
          setIsExporting(true);
          
          const result = await exportVotersToExcelFn({
            data: {
              electionId: electionId,
              statusFilter: statusFilter // Automatically uses your URL search status state
            }
          } as any);
          
          if (!result.success || !result.base64Data) {
            alert(result.error || "Export failed.");
            return;
          }
      
          // Convert the base64 payload into a file download trigger
          const byteCharacters = atob(result.base64Data);
          const byteArrays = [];
          const sliceSize = 512;
      
          for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
          }
      
          const fileBlob = new Blob(byteArrays, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const downloadUrl = window.URL.createObjectURL(fileBlob);
          const linkElement = document.createElement('a');
          
          linkElement.href = downloadUrl;
          linkElement.download = result.filename;
          document.body.appendChild(linkElement);
          linkElement.click();
          
          document.body.removeChild(linkElement);
          window.URL.revokeObjectURL(downloadUrl);
      } catch (err: any) {
          console.error("Client side download processing execution exception:", err);
      } finally {
          setIsExporting(false);
      }
  };

  const handleExcelUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) return;

    const reader = new FileReader();
    reader.readAsArrayBuffer(excelFile);
    reader.onload = (e) => {
      try {
        
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<any>(worksheet);
        
        // Sanitize and format the raw rows for your Arkesel Payload
        const sanitizedJson = rawJson.map((row) => {
          const username = String(row.username ?? "").replace(/\s+/g, "").trim();
          const cleanPhone = addCountryCode(row.phone);

          return {
            username,
            name: row.name?.trim(),
            phoneNumber: cleanPhone,
            electionId: electionId,
            inviteToken: generateSixDigitCode(),
            email: row?.email?.trim() || `${username}@vote.local`,
          };
        });
        // Import Data into Database - voters table
        importExcelMutation.mutate({ data: sanitizedJson } as any);
        
      } catch (error) {
        console.error('Error reading Excel file on frontend:', error);
      } finally {
        setIsExcelModalOpen(false);
        setExcelFile(null);
      }
    }
  }


  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ================= HEADER RIBBON CONTROLS ================= */}
        <div className="grid grid-cols-5 gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          <div className="col-span-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Voters Manager</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Manage eligibility list, trace authentication access, and send invitation codes to voters.
            </p>
          </div>
          
          <div className="col-span-3 flex flex-col md:flex-row items-center gap-3 shrink-0">

            <button
              className="flex items-center gap-2 bg-[#E3F09B] text-black text-xs font-bold hover:bg-zinc-800 hover:text-white border border-zinc-800 px-3.5 py-2 rounded-lg transition-all"
            >
             <span>{voters?.length} Voters</span>
            </button>
            
           
            {/* Send Bulk Invite */}
            <button
              onClick={handleInviteVoters}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs px-3.5 py-2 rounded-lg font-medium text-zinc-300 transition-all"
            >
              <Smartphone className="w-3 h-3 text-purple-400" />
              <span>Send Invites</span>
            </button>


            {/* Excel Download Action Toggle Button */}
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs px-3.5 py-2 rounded-lg font-medium text-zinc-300 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Export Voters</span>
            </button>

             {/* Excel Upload Action Toggle Button */}
             <button
              onClick={() => setIsExcelModalOpen(true)}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs px-3.5 py-2 rounded-lg font-medium text-zinc-300 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Import Voters</span>
            </button>

            {/* Create Single Voter Route Anchor Link */}
            <Link
              to={`/admin/elections/${electionId}/voters/new`} 
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-md transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Voter</span>
            </Link>
          </div>
        </div>

        {/* ================= FILTERS & QUICK CONTROLS AREA ================= */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
          {/* Reactive Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
          </div>

          {/* Tabular Status Filter Segmentation */}
          <div className="flex items-center gap-2 bg-[#0a192a]/50 p-1 border border-zinc-800 rounded-lg w-full sm:w-auto">
            {(["ALL", "VOTED", "PENDING"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 sm:flex-initial text-[11px] font-semibold px-3 py-1.5 rounded-md uppercase tracking-wider transition-all ${statusFilter === filter ? "bg-purple-600 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* ================= DATAGRID DIRECTORY RECORDS TABLE ================= */}
        <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Voter Profile Details</th>
                  <th className="px-6 py-4">Phone Matrix</th>
                  <th className="px-6 py-4 text-center">Invited Key</th>
                  <th className="px-6 py-4 text-center">Invite Status</th>
                  <th className="px-6 py-4 text-center">Ballot State</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {filteredVoters.length > 0 ? (
                  filteredVoters.map((voter: any) => (
                    <tr key={voter.id} className="hover:bg-zinc-900/20 transition-colors group">
                      
                      {/* Name, Username, and Email Blocks */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white tracking-wide">{voter?.name}</span>
                          <span className="text-xs text-zinc-500 font-mono mt-0.5">{voter?.username}</span>
                          <span className="text-xs text-zinc-400 mt-1">{voter?.email}</span>
                        </div>
                      </td>

                      {/* Phone metadata info */}
                      <td className={`px-6 py-4 align-middle text-xs font-mono ${voter?.phoneNumber.length < 9 ? 'text-red-300 font-bold italic' : 'text-zinc-400'} `}>
                        <div className="inline-flex justify-center items-center gap-1.5">
                          { voter?.phoneNumber.length < 9 
                            ? <MessageCircleWarning className="w-3 h-3" /> 
                            : <PhoneCallIcon className="w-3 h-3" /> 
                          }
                          <span className={`${voter?.phoneNumber.length < 9 ? 'text-red-300 font-bold italic' : 'text-zinc-400'} `}>{voter?.phoneNumber || '-- No Phone Number --'} </span>
                        </div>
                      </td>

                      {/* 6-Digit invite token element slot */}
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="font-mono text-xs font-bold bg-zinc-900 border border-zinc-800 text-purple-400 px-2 py-1 rounded select-all shadow-sm">
                          {voter?.inviteToken}
                        </span>
                      </td>

                      {/* Verification Badge Node */}
                      <td className="px-6 py-4 align-middle text-center">
                        <div className="inline-flex justify-center">
                          {voter.isVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Delivered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" /> Unclaimed
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Voted Action Track Badge */}
                      <td className="px-6 py-4 align-middle text-center">
                        <div className="inline-flex justify-center">
                          {voter.hasVoted ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/30 border border-purple-900/30 px-2 py-0.5 rounded-full">
                              Voted
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                              Eligible
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Row Action Blocks: Edit and Delete Buttons */}
                      <td className="px-6 py-4 align-middle text-right">
                      { !voter.hasVoted && (<>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleInviteVoter(voter.id)}
                            className="cursor-pointer inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
                          >
                            <Smartphone className="w-3 h-3 text-purple-400" />
                            <span>Invite</span>
                          </button>
                          <Link
                            to={`/admin/elections/${electionId}/voters/${voter?.id}/edit`} 
                            
                            title="Edit Voter Profile"
                            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                         
                            <button
                              onClick={() => handleDeleteVoter(voter.id)}
                              title="Delete Record"
                              className="p-1.5 cursor-pointer rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        </>)}
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 border border-dashed border-zinc-900 rounded-b-xl text-zinc-500 text-xs">
                      No voters tracked matching selected filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* EXCEL BULK FILE INGESTION STORAGE DIALOG OVERLAY                         */}
      {/* ========================================================================= */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 px-4 duration-200">
          <div className="bg-[#0a192a]/50 border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-5 relative animate-in zoom-in-95 duration-150 text-zinc-200">
            
            {/* Dismiss trigger */}
            <button 
              onClick={() => { setIsExcelModalOpen(false); setExcelFile(null); }} 
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Batch Import Directory Sheet
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Upload an Excel (.xlsx) or CSV data log list. Ensure headers align explicitly with <span className="font-mono text-purple-400">name, username, email, phone</span> constraints.
            </p>

            <form onSubmit={handleExcelUploadSubmit} className="space-y-4">
              <div 
                onClick={() => document.getElementById("excel-input-field")?.click()}
                className={`w-full border-2 border-dashed rounded-lg p-6 bg-zinc-900/30 text-center flex flex-col items-center justify-center group transition-all cursor-pointer ${excelFile ? 'border-emerald-500/40 bg-emerald-950/5' : 'border-zinc-800 hover:border-zinc-700'}`}
              >
                <input 
                  type="file" 
                  id="excel-input-field"
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setExcelFile(e.target.files[0])}
                />
                
                <Upload className={`w-7 h-7 mb-2 transition-colors ${excelFile ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-purple-400'}`} />
                <span className="text-xs font-medium text-zinc-300">
                  {excelFile ? excelFile.name : "Select voter registry file"}
                </span>
                <span className="text-[10px] text-zinc-500 mt-1">XLSX, XLS, CSV formats supported</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
                <button 
                  type="button"
                  onClick={() => { setIsExcelModalOpen(false); setExcelFile(null); }} 
                  className="px-3 py-1.5 border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-900 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!excelFile}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-white font-semibold rounded-md transition-all shadow-md"
                >
                  Process Upload
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </>
  );
}
