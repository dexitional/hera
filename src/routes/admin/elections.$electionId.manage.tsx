import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  Sliders, Users, Award, ShieldCheck, ArrowUpRight, Plus,
  Calendar, Key, ToggleLeft, ToggleRight, CheckCircle2, LayoutGrid, BarChart3,
  Loader2,
  FileSpreadsheet,
  Activity,
  Pencil,
  RotateCcw,
  ClockPlus,
  Receipt,
  CreditCard,
  FileText
} from "lucide-react";
import { exportElectionResultsToExcelFn, exportElectionResultsToFormatExcelFn, extendElectionEndTimeFn, getElectionOverview, resetElectionFn, updateElectionPublicStateFn, updateElectionStatusFn } from "#/server/tenant-elections";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import moment from "moment";

const ELECTION_STATUSES = ['staged', 'started', 'ended'] as const;
type ElectionStatus = typeof ELECTION_STATUSES[number];

const electionsQueryOptions = (electionId: any) => ({
  queryKey: ['election-overview', electionId ],
  queryFn: () => getElectionOverview({ data: electionId }),
});

export const Route = createFileRoute("/admin/elections/$electionId/manage")({
  component: ManageElectionConsole,
  loader: async ({ context, params }:any) => {
    const electionId = params.electionId;
    await context.queryClient.ensureQueryData(electionsQueryOptions(electionId));
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});

function ManageElectionConsole() {
  
  const { electionId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate  = useNavigate();
  let { data: election}:any = useSuspenseQuery(electionsQueryOptions(electionId));

  election = {
    ...election,
    authMode: election?.otp?.toLowerCase() == 'otp' ? 'One-Time Password (SMS / Email)' : election.otp == 'GOOGLE' ? 'Google Authentication': 'Username & Password',
    startAt: moment(election.startAt).format('LLL'),
    endAt: moment(election.endAt).format('LLL'),
  }

  console.log(election)
  const [status, setStatus] = useState<ElectionStatus>(election.status);
  const [isPublic, setIsPublic] = useState<boolean>(!!election.makePublic);
  // Computes active mathematical voter turnout percentage on runtime execution profiles
  const turnoutPercentage = ((election.counts.votesCast / election.counts.voters) * 100).toFixed(1);
  const [isExportingResults, setIsExportingResults] = useState(false);

  const statusMutation = useMutation({ mutationFn: updateElectionStatusFn });
  const publicStateMutation = useMutation({ mutationFn: updateElectionPublicStateFn });
  const resetMutation = useMutation({ mutationFn: resetElectionFn });

  const handleStatusChange = (nextStatus: ElectionStatus) => {
    if (nextStatus === status || statusMutation.isPending) return;
    const previousStatus = status;
    setStatus(nextStatus);
    statusMutation.mutate({ data: { electionId, status: nextStatus } } as any, {
      onError: () => setStatus(previousStatus),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['election-overview', electionId] }),
    });
  };

  const handleTogglePublic = () => {
    if (publicStateMutation.isPending) return;
    const nextIsPublic = !isPublic;
    setIsPublic(nextIsPublic);
    publicStateMutation.mutate({ data: { electionId, makePublic: nextIsPublic } } as any, {
      onError: () => setIsPublic(!nextIsPublic),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['election-overview', electionId] }),
    });
  };

  const handleResetElection = () => {
    if (resetMutation.isPending) return;
    const confirmed = confirm(
      "Reset this election? This will permanently erase all cast ballots, and every voter will be marked as not-yet-voted so they can vote again. This action cannot be undone."
    );
    if (!confirmed) return;

    const expectedPasscode = moment().format('YYYYMM');
    const enteredPasscode = prompt(
      "Security confirmation required.\nEnter the current security passcode to proceed with the reset:"
    );
    if (enteredPasscode === null) return;
    if (enteredPasscode.trim() !== expectedPasscode) {
      alert("Incorrect passcode. Election reset aborted.");
      return;
    }

    resetMutation.mutate({ data: { electionId } } as any, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['election-overview', electionId] });
        alert("Election has been reset. All votes were cleared and voters can vote again.");
      },
      onError: (error: any) => alert(error?.message || "Failed to reset election."),
    });
  };

  const extendEndTimeMutation = useMutation({ mutationFn: extendElectionEndTimeFn });

  const handleExtendEndTime = () => {
    if (extendEndTimeMutation.isPending) return;
    const input = prompt("Extend election end time by how many hours?", "1");
    if (input === null) return;
    const hours = Number(input);
    if (!Number.isFinite(hours) || hours <= 0) {
      alert("Enter a valid positive number of hours.");
      return;
    }

    extendEndTimeMutation.mutate({ data: { electionId, hours } } as any, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['election-overview', electionId] });
        alert(`Election end time extended by ${hours} hour(s).`);
      },
      onError: (error: any) => alert(error?.message || "Failed to extend election end time."),
    });
  };

  const handleExportCertifiedResults = async () => {
    try {
      setIsExportingResults(true);
      
      const result = await exportElectionResultsToFormatExcelFn({
        data: { electionId: electionId }
      } as any);
      
      if (!result.success || !result.base64Data) {
        alert(result.error || "Export failed to execute correctly.");
        return;
      }

      // Unpack base64 data stream to system blobs
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
      console.error("Client layer download generation logic crash exception:", err);
    } finally {
      setIsExportingResults(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ================= WORKSPACE CONSOLE BREADCRUMB HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          
          <div className="space-y-1 flex-3">
            <div className="flex items-center gap-2 text-xs text-zinc-200 font-mono uppercase tracking-wider">
              <Link to="/admin/elections" className="hover:text-purple-400 transition-colors">Election Centre</Link>
              <span>/</span>
              <span className="text-purple-400 select-all font-bold">{election.tag}</span>
            </div>
            <h1 className="text-sm sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              <span>{election.title}</span>
            </h1>
          </div>

          <div className="flex-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Edit / Reset Quick Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/admin/elections/${election?.id}/edit`}
                      title="Edit Main Election Form"
                      className="flex flex-col items-center justify-center gap-2 px-3 h-14 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="text-[9px] font-bold uppercase tracking-wide leading-none">Edit</span>
                    </Link>
                    {status === 'staged' && (
                      <button
                        type="button"
                        onClick={handleResetElection}
                        disabled={resetMutation.isPending}
                        title="Reset Election (clears all votes)"
                        className="flex flex-col items-center justify-center gap-2 px-3 h-14 rounded-xl border border-red-900/40 bg-red-950/20 text-red-400 hover:text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {resetMutation.isPending ? (
                          <Loader2 className="p-1 w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        <span className="text-[9px] font-bold uppercase tracking-wide leading-none">Reset</span>
                      </button>
                    )}
                  </div>

                  {/* Main Election Status - Three-State Cycle Control */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 shrink-0">
                    <div className="flex flex-col sm:text-right">
                      <span className="text-xs font-semibold text-white">Election Status</span>
                      <span className="text-[10px] text-zinc-500 font-medium">Set election status</span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#0a192a]/50 border border-zinc-800 rounded-lg p-1">
                      {ELECTION_STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={statusMutation.isPending}
                          onClick={() => handleStatusChange(s)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
                            status === s
                              ? s === 'started'
                                ? 'bg-emerald-500 text-white'
                                : s === 'ended'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-zinc-700 text-white'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
              </div>

              {/* Make Election Public Switch */}
              <div className="flex items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 shrink-0">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-white">Make Election Public</span>
                    <span className="text-[10px] text-zinc-500 font-medium">Toggle preview state live</span>
                  </div>
                  <button
                    type="button"
                    disabled={publicStateMutation.isPending}
                    onClick={handleTogglePublic}
                    className="focus:outline-none transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isPublic ? (
                      <ToggleRight className="w-9 h-9 text-emerald-400 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-zinc-600 cursor-pointer" />
                    )}
                  </button>
                </div>
              </div>

          </div>

         


        {/* ================= QUICK STATS DISCOVERY RIBBON ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          
          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Turnout Density</p>
            <h3 className="text-2xl font-black text-white mt-1 font-mono">{!isNaN(parseFloat(turnoutPercentage)) ? turnoutPercentage : 0}%</h3>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2.5 overflow-hidden border border-zinc-800/40">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${turnoutPercentage}%` }} />
            </div>
          </div>

          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Ballots Cast</p>
            <h3 className="text-2xl font-black text-purple-400 mt-1 font-mono">{election.counts.votesCast.toLocaleString()}</h3>
            <p className="text-[10px] text-zinc-500 mt-2 font-medium">Audited cryptographic receipts</p>
          </div>

          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Timeline Start</p>
            <p className="text-xs font-semibold text-zinc-200 mt-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" /> {election.startAt.split(',')[0]}
            </p>
            <p className="text-[10px] font-mono text-zinc-500 mt-1">{election.startAt.split(',')[1]}</p>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-900">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Timeline End</p>
                <p className="text-xs font-semibold text-zinc-200 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" /> {election.endAt.split(',')[0]}
                </p>
                <p className="text-[10px] font-mono text-zinc-500 mt-1">{election.endAt.split(',')[1]}</p>
              </div>
              <button
                type="button"
                onClick={handleExtendEndTime}
                disabled={extendEndTimeMutation.isPending}
                title="Extend Election End Time"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0"
              >
                {extendEndTimeMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ClockPlus className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Security Auth Gate</p>
            <p className="text-xs font-semibold text-zinc-200 mt-2 flex items-center gap-1.5 truncate">
              <Key className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> {election.authMode}
            </p>
            <p className="text-[10px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Anti-tamper verification active
            </p>
          </div>

          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Billing & Invoice</p>
              {election.billPaid ? (
                <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded-full">Paid</span>
              ) : (
                <span className="text-[9px] font-bold uppercase tracking-wide text-amber-400 bg-amber-950/20 border border-amber-900/30 px-1.5 py-0.5 rounded-full">Unpaid</span>
              )}
            </div>
            <p className="text-xs font-semibold text-zinc-200 mt-2 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              {election.billAmount ? `GHS ${Number(election.billAmount).toLocaleString()}` : 'Not yet billed'}
            </p>
            <div className="flex flex-col gap-1.5 mt-3">
              <Link
                to={`/admin/elections/${election?.id}/invoice`}
                className="flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[10px] font-semibold py-1.5 rounded-lg transition-all"
              >
                <FileText className="w-3 h-3" /> Generate Invoice
              </Link>
              <Link
                to={`/admin/elections/${election?.id}/pay`}
                className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-semibold py-1.5 rounded-lg transition-all"
              >
                <CreditCard className="w-3 h-3" /> Pay Invoice
              </Link>
              <Link
                to={`/admin/elections/${election?.id}/receipt`}
                className="flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[10px] font-semibold py-1.5 rounded-lg transition-all"
              >
                <Receipt className="w-3 h-3" /> Print Receipt
              </Link>
            </div>
          </div>

        </div>

        {/* ================= INTERACTIVE CONFIGURATION CARDS CONTAINER ================= */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> Management Sectors
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: POSITIONS CONFIGURATION SECTOR */}
            <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-purple-950/30 border border-purple-900/30 flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded">
                    {election.counts.positions} Registered
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Positions Manager</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Establish structural ballot departments, provision winner tier criteria bounds.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-6 border-t border-zinc-900 pt-4 w-full">
                <Link
                  to={`/admin/elections/${election?.id}/positions/new`}
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs py-2 rounded-lg font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Add New Position</span>
                </Link>
                <Link
                  to={`/admin/elections/${election?.id}/positions`}
                  className="inline-flex items-center justify-center w-10 h-8 rounded-lg border border-zinc-800 bg-[#0a192a]/50 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                  title="View Registry List"
                >
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* CARD 2: CANDIDATES MANAGEMENT SECTOR */}
            <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-orange-950/30 border border-orange-900/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded">
                    {election.counts.candidates} Registered
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Candidates Manager</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Enroll candidates, audit branding portraits and review biographical metadata variables.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-6 border-t border-zinc-900 pt-4 w-full">
                <Link
                  to={`/admin/elections/${election?.id}/candidates/new`}
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs py-2 rounded-lg font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Add New Candidate</span>
                </Link>
                <Link
                  to={`/admin/elections/${election?.id}/candidates`}
                  className="inline-flex items-center justify-center w-10 h-8 rounded-lg border border-zinc-800 bg-[#0a192a]/50 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                  title="Open Candidates Grid"
                >
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* CARD 3: VOTERS REGISTRY ROLL SECTOR */}
            <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-950/30 border border-emerald-900/30 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded">
                    {election.counts.voters.toLocaleString()} Registered
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Voters Manager</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Manage electoral rosters, monitor 6-digit access tokens, override credentials, and batch-upload voter sheets via Excel.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-6 border-t border-zinc-900 pt-4 w-full">
                <Link
                  to="/admin/voters/new"
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs py-2 rounded-lg font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Add New Voter</span>
                </Link>
                <Link
                  to={`/admin/elections/${election?.id}/voters`}
                  className="inline-flex items-center justify-center w-10 h-8 rounded-lg border border-zinc-800 bg-[#0a192a]/50 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                  title="Open Voters Directory"
                >
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* ================= LIVE AUDIT / EXTRA METRICS PANEL LINK ================= */}
        <div className="bg-gradient-to-r from-purple-950/20 via-[#0a192a]/50 to-[#0a192a]/50 rounded-xl border border-zinc-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Real-time Audit Stream</h4>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Review the signed ledger rows to analyze vote distributions across ballot streams as they occur.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">

              <button
                onClick={() => navigate({ to: `/admin/elections/${election?.id}/results`})}
                disabled={election.status && ['staged','started'].includes(election?.status)}
                className="w-full sm:w-auto flex items-center gap-1 text-center px-4 py-2 disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed bg-green-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg transition-all shadow-sm shrink-0"
              >
                <Activity className="h-4 animate-pulse" />
                <span className="">Print Results</span>
              </button>
              <button
                onClick={handleExportCertifiedResults}
                disabled={election.status && ['staged','started'].includes(election?.status)}
                className="w-full sm:w-auto flex items-center gap-1 text-center px-4 py-2 disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed bg-green-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg transition-all shadow-sm shrink-0"
              >
                <FileSpreadsheet className="h-4" />
                <span>Export Results</span>
              </button>

              <button
                onClick={() => navigate({ to: `/admin/elections/${election?.id}/feed`})}
                disabled={election.status && ['staged'].includes(election?.status)}
                className="w-full sm:w-auto flex items-center gap-1 text-center px-4 py-2 disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg transition-all shadow-sm shrink-0"
              >
                 <Activity className="h-4 animate-pulse" />
                 <span className="">Open Live Stream</span>
              </button>
           </div>
        </div>

    </div>
  );
}
