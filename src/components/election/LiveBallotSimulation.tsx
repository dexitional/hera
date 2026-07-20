import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckCircle2, RotateCcw,
  Lock, Award, User, Fingerprint, AlertCircle, ShieldAlert, Home,
  ShieldCheck, ArrowLeft,
  FingerprintIcon
} from "lucide-react";
import { castBallotServerFn } from "#/server/tenant-elections";



export default function LiveBallotSimulation({ user, data: ballotPositions }: any) {

  const navigate = useNavigate();
  const [voter] = useState<any>(user);
  // const [ballotPositions] = useState<PositionGroup[]>(data);
  const [selections, setSelections] = useState<Record<string, string | number>>({});
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ ballotSuccess, setBallotSuccess ] = useState(false);

  const handleSelectCandidate = (positionId: string, candidateId: string | number) => {
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

  const handleGoToPreviousStep = () => {
    setActiveStepIndex((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalizeVotesSubmit = async () => {
    setIsSubmitting(true);
    try {
     
      const formattedSelections: any = Object.entries(selections).map(([positionId, candidateId]) => ({
          positionId,
          // Transforms frontend flag value -1 into null for compliance with Drizzle schema
          candidateId: candidateId === -1 ? null : candidateId,
      }));

      // Check to make sure selections are made for all portfolios
      if(formattedSelections.length !== ballotPositions.length)
        throw new Error("Please check your network connection\nReset ballot and reselect candidates.");

      const response = await castBallotServerFn({
         data: {
          voterId: voter?.id,
          electionId: voter?.electionId,
          inviteToken: voter?.inviteToken,
          selections: formattedSelections
        }
      } as any);

      if (response.success) {
        setBallotSuccess(true);
        setTimeout(() => { navigate({ to: `/elections`}) },3000)
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
      
      <div className="my-10 mx-auto w-4/5 sm:w-full sm:max-w-md bg-[#0a192a]/50 border border-purple-500/20 rounded-xl p-6 shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Accent Danger top layout stripe bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-amber-500" />
          
          <div className="w-12 h-12 rounded-full bg-amber-950/30 border border-amber-900/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>

          <h2 className="text-base font-bold text-white tracking-tight uppercase tracking-wider text-xs">
            Access Restrained: User has already Voted.
          </h2>
          
          <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
            Hello <span className="text-zinc-200 font-semibold">{voter?.name}</span>, our security ledger indicates that your credential <code className="font-mono text-purple-400 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">{voter?.username}</code> has already executed and signed a final ballot transaction form for this election.
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
      
    );
  }

  const showReviewSummary = activeStepIndex === ballotPositions.length;

  if (ballotSuccess) {
    return (
      <div className="w-full max-w-md mx-auto my-20 p-6 bg-[#0a192a]/50 border border-zinc-800 rounded-xl text-center font-sans animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Ballot Submitted Securely</h3>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          Thank you, <span className="text-purple-400 font-semibold">{voter?.name}</span>. Your choices have been cryptographically signed and serialized onto the main audit ledger. Your access eligibility status has been set to closed.
        </p>
       
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0a192a]/30 text-zinc-200 font-sans p-4 md:p-6 overflow-x-hidden relative select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ================= SECURE TERMINAL HEADER ================= */}
        <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-purple-400" />
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">VOTER:: {voter?.username}</h1>
              <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                Voter Name: {voter?.name} 
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
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
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
                          <div className="w-full h-52 border-b border-zinc-900 flex items-center justify-center relative overflow-hidden bg-white/60 shrink-0">
                            {candidate.imageUrl ? (
                              <img src={candidate.imageUrl} aria-label={candidate.name} alt={candidate.name} className="w-full h-full object-contain" />
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
                              <h4 className="text-sm font-bold text-white tracking-wide">{candidate.name}</h4>
                              {candidate.teaser && (<p className="text-[12px] font-bold text-purple-400 line-clamp-2 leading-snug mt-0.5">{candidate.teaser}</p>)}
                              <p className="text-base italic text-zinc-400 line-clamp-2 leading-snug mt-0.5">#{candidate.order}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-zinc-900 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
                    {posIndex > 0 && (
                      <button
                        type="button"
                        onClick={handleGoToPreviousStep}
                        className="order-2 sm:order-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all bg-[#0a192a]/50 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSelectCandidate(position.id, -1)}
                      className={`order-1 sm:order-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all bg-red-500/50 border-zinc-800 text-white hover:text-amber-400 hover:border-amber-500/40`}
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
                
                <div className="border-b border-zinc-900 pb-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-[11px]">
                    <Fingerprint className="w-4 h-4 text-purple-400" />
                    <span>Review Final Ballot Selections</span>
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded">
                    Audit Verification
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                          <span className="text-[10px] text-purple-200 uppercase tracking-wider font-bold block">{position.title}</span>
                          <span className={`text-xs font-bold block truncate mt-0.5 ${chosenId === -1 ? 'text-amber-400 italic' : 'text-white'}`}>
                            {chosenId === -1 ? "ABSTAINED / SKIPPED" : chosenCandidate?.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-zinc-600 pt-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleGoToPreviousStep}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-300 text-xs font-semibold px-2 py-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> BACK
                    </button>
                    <button
                      type="button"
                      onClick={handleResetBallot}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-300 text-xs font-semibold px-2 py-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> RESET BALLOT
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinalizeVotesSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center text-center gap-2 bg-green-700 hover:bg-purple-500 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-xl disabled:opacity-40 transition-all"
                  >
                     <FingerprintIcon className="w-6 h-6" />
                    {isSubmitting ? "Signing Ledger..." : "CONFIRM & CAST BALLOT"}
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
