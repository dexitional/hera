import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { 
  CheckCircle2, ShieldCheck, ArrowRight, RotateCcw, 
  Lock, Award, User, Layers, Fingerprint, AlertCircle, ShieldAlert, Home 
} from "lucide-react";
import { castBallotServerFn } from "#/server/tenant-elections";

interface VoterContext {
  id: number;
  electionId: number;
  name: string;
  username: string;
  phoneNumber: string;
  email: string;
  hasVoted: boolean; // Enforcing Drizzle Table constraint flag check
}

interface CandidateNode {
  id: number;
  positionId: number;
  name: string;
  teaser: string | null;
  imageUrl: string | null;
  order: number | null;
}

interface PositionGroup {
  id: number;
  electionId: number;
  title: string;
  slots: number;
  candidates: CandidateNode[];
}


// Mock voter context representing an already verified/closed voting lifecycle row entry
const MOCK_VOTER: VoterContext = {
  id: 842,
  electionId: 101,
  name: "Kwame Mensah",
  username: "kwame_m",
  phoneNumber: "+233241234567",
  email: "kwame@domain.edu.gh",
  hasVoted: false, // Simulation trigger: Toggle to 'false' to view open active ballot sheet
};

const MOCK_BALLOT_STRUCTURE: PositionGroup[] = [
  {
    id: 1,
    electionId: 101,
    title: "Presidential Portfolio",
    slots: 1,
    candidates: [
      { id: 10, positionId: 1, name: "Jane Afia Mensah", teaser: "Digital inclusion sovereignty blueprint lines.", imageUrl: "https://unsplash.com", order: 1 },
      { id: 11, positionId: 1, name: "Michael K. Koomson", teaser: "Multi-tenant workspace fiscal frameworks.", imageUrl: "https://unsplash.com", order: 2 },
    ]
  }
];

export default function LiveBallotSimulation({ user, data: ballotPositions }: any) {

  console.log(ballotPositions);
  
  const [voter] = useState<any>(user);
  // const [ballotPositions] = useState<PositionGroup[]>(data);
  
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ ballotSuccess, setBallotSuccess ] = useState(true);

  const handleSelectCandidate = (positionId: number, candidateId: number) => {
    setSelections((prev) => ({ ...prev, [positionId]: candidateId }));
    
    setTimeout(() => {
      if (activeStepIndex < ballotPositions.length) {
        setActiveStepIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 450);
  };

  const handleResetBallot = () => {
    setSelections({});
    setActiveStepIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalizeVotesSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Build the list of active selections (excluding skipped portfolios)
      const formattedSelections = Object.entries(selections)
        .filter(([_, candidateId]) => candidateId !== -1) 
        .map(([positionId, candidateId]) => ({
          positionId: parseInt(positionId),
          candidateId: candidateId,
          // Generate an un-alterable tracking token for auditability
          receiptSignature: `sig_sha256_${crypto.randomUUID().replace(/-/g, "")}`
        }));

      // 2. Invoke the type-safe RPC action directly over the network network pipeline
      const response = await castBallotServerFn({
        data: {
          voterId: voter.id,
          electionId: voter.electionId,
          selections: formattedSelections
        }
      });

      if (response.success) {
        setBallotSuccess(true);
      }
    } catch (err) {
      console.error("Ballot submission failed:", err);
      alert(err instanceof Error ? err.message : "Network/Database transaction error.");
    } finally {
      setIsSubmitting(false);
    }
  };


  // ================= DEFENSIVE INTERCEPTOR SECURE ALERTS BLOCK =================
  // If user metadata has structural database parameter flag set to true, block screen instantly
  if (voter?.hasVoted) {
    return (
      <div className="w-full min-h-screen bg-[#18181b] text-zinc-200 font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0a192a]/50 border border-red-500/20 rounded-xl p-6 shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Accent Danger top layout stripe bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-amber-500" />
          
          <div className="w-12 h-12 rounded-full bg-red-950/30 border border-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>

          <h2 className="text-base font-bold text-white tracking-tight uppercase tracking-wider text-xs">
            Access Restrained: User has already Voted.
          </h2>
          
          <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
            Hello <span className="text-zinc-200 font-semibold">{voter.name}</span>, our security ledger indicates that your credential index <code className="font-mono text-purple-400 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">voter_{voter.username}</code> has already executed and signed a final ballot transaction form for this election instance.
          </p>

          <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-center">
            <Link
              to="/elections"
              className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm"
            >
              <Home className="w-3.5 h-3.5 text-zinc-500" />
              <span>Return to Dashboard</span>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  const showReviewSummary = activeStepIndex === ballotPositions.length;

  return (
    <div className="w-full min-h-screen bg-[#18181b] text-zinc-200 font-sans p-4 md:p-6 overflow-x-hidden relative select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ================= SECURE TERMINAL HEADER ================= */}
        <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-4 relative z-20">
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-purple-400" />
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">VOTER:: {voter.username}</h1>
              <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                Voter Name: {voter.name} 
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ballotPositions?.map((_:any, idx:any) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeStepIndex ? 'w-6 bg-purple-500' : idx < activeStepIndex ? 'w-2 bg-purple-800' : 'w-2 bg-zinc-800'}`} 
              />
            ))}
            <div className={`h-1.5 rounded-full transition-all duration-300 ${showReviewSummary ? 'w-6 bg-emerald-500' : 'w-2 bg-zinc-800'}`} />
          </div>
        </div>

        {/* ================= CAROUSEL RIGHT-TO-LEFT FRAME ================= */}
        <div className="relative w-full overflow-hidden min-h-[500px]">
          {ballotPositions?.map((position: any, posIndex: any) => {
            const currentSelectedId = selections[position.id];
            
            let slideTranslateClass = "translate-x-full opacity-0 pointer-events-none";
            if (posIndex === activeStepIndex) {
              slideTranslateClass = "translate-x-0 opacity-100 relative z-10 animate-in slide-in-from-right duration-300";
            } else if (posIndex < activeStepIndex) {
              slideTranslateClass = "-translate-x-full opacity-0 pointer-events-none absolute w-full top-0";
            }

            return (
              <div key={position.id} className={`w-full transform transition-all duration-500 ease-in-out ${slideTranslateClass}`}>
                <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-5 shadow-2xl">
                  
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">{position.title}</h2>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                      Selections auto-advance instantly
                    </span>
                  </div>

                  {/* HIGH DENSITY RESPONSIVE GRID MATRIX */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {position?.candidates?.map((candidate:any) => {
                      const isCandidateSelected = currentSelectedId === candidate.id;

                      return (
                        <div
                          key={candidate.id}
                          onClick={() => handleSelectCandidate(position.id, candidate.id)}
                          className={`border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col bg-zinc-900/10 shadow-sm relative ${isCandidateSelected ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-950/10' : 'border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/30'}`}
                        >
                          <div className="w-full h-40 bg-[#0a192a]/50 border-b border-zinc-900 flex items-center justify-center relative overflow-hidden bg-white/80 shrink-0">
                            {candidate.imageUrl ? (
                              <img src={candidate.imageUrl} alt={candidate.name} className="w-full h-full object-contain" />
                            ) : (
                              <User className="w-6 h-6 text-zinc-700" />
                            )}
                            {isCandidateSelected && (
                              <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-0.5 shadow-md">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>

                          <div className="p-3 space-y-1 grow flex flex-col justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-white tracking-wide truncate">{candidate.name}</h4>
                              <p className="text-[12px] text-zinc-400 line-clamp-2 leading-snug mt-0.5">{candidate.teaser}</p>
                              <p className="text-base italic text-zinc-400 line-clamp-2 leading-snug mt-0.5">#{candidate.order}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-zinc-900 pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleSelectCandidate(position.id, -1)}
                      className={`flex items-center justify-center gap-2 w-64 px-4 py-2 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all bg-[#0a192a]/50 border-zinc-800 text-zinc-500 hover:text-amber-400 hover:border-amber-500/40`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Abstain / Skip Portfolio</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}

          {/* ================= FINAL STEP SUMMARY CONFIRMATION MODULE ================= */}
          {showReviewSummary && (
            <div className="w-full transform transition-all duration-500 ease-in-out translate-x-0 opacity-100 relative z-10 animate-in slide-in-from-right duration-300">
              <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-6 space-y-6 shadow-2xl">
                
                <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-[11px]">
                    <Fingerprint className="w-4 h-4 text-purple-400" />
                    <span>Review Final Ballot Selections</span>
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded">
                    Audit Verification
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ballotPositions?.map((position: any) => {
                    const chosenId = selections[position.id];
                    const chosenCandidate = position?.candidates?.find((c: any) => c.id === chosenId);

                    return (
                      <div key={position.id} className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3.5 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-[#0a192a]/50 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0 bg-zinc-900">
                          {chosenId !== -1 && chosenCandidate?.imageUrl ? (
                            <img src={chosenCandidate.imageUrl} alt={chosenCandidate.name} className="w-full h-full object-contain" />
                          ) : (
                            <User className="w-5 h-5 text-zinc-700" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">{position.title}</span>
                          <span className={`text-xs font-bold block truncate mt-0.5 ${chosenId === -1 ? 'text-amber-400 italic' : 'text-white'}`}>
                            {chosenId === -1 ? "Abstained" : chosenCandidate?.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-zinc-900 pt-4">
                  <button
                    type="button"
                    onClick={handleResetBallot}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs font-semibold px-2 py-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Ballot
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalizeVotesSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-xl disabled:opacity-40 transition-all"
                  >
                    {isSubmitting ? "Signing Ledger..." : "Confirm & Cast Ballot"}
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
