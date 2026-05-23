import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { 
  CheckCircle2, ShieldCheck, ArrowRight, RotateCcw, 
  Lock, Award, User, Layers, Fingerprint, AlertCircle 
} from "lucide-react";

interface VoterContext {
  id: number;
  electionId: number;
  name: string;
  username: string;
  phoneNumber: string;
  email: string;
  hasVoted: boolean;
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


const MOCK_VOTER: VoterContext = {
  id: 842,
  electionId: 101,
  name: "Kwame Mensah",
  username: "kwame_m",
  phoneNumber: "+233241234567",
  email: "kwame@domain.edu.gh",
  hasVoted: false,
};

// Seed extended candidate data matrices (6 profiles per block) to evaluate high-density grids
const MOCK_BALLOT_STRUCTURE: PositionGroup[] = [
  {
    id: 1,
    electionId: 101,
    title: "Presidential Portfolio",
    slots: 1,
    candidates: [
      { id: 10, positionId: 1, name: "Jane Afia Mensah", teaser: "Digital inclusion sovereignty blueprint lines.", imageUrl: "https://unsplash.com", order: 1 },
      { id: 11, positionId: 1, name: "Michael K. Koomson", teaser: "Multi-tenant workspace fiscal frameworks.", imageUrl: "https://unsplash.com", order: 2 },
      { id: 12, positionId: 1, name: "Dr. Kwame Baah", teaser: "Healthcare integration node expansions.", imageUrl: "https://unsplash.com", order: 3 },
      { id: 13, positionId: 1, name: "Ellen Serwaa Aku", teaser: "Decentralized ecosystem grant models.", imageUrl: "https://unsplash.com", order: 4 },
      { id: 14, positionId: 1, name: "Emmanuel Osei Poku", teaser: "Infrastructure pipeline scaling actions.", imageUrl: "https://unsplash.com", order: 5 },
      { id: 15, positionId: 1, name: "Abena Mansa Boateng", teaser: "Electoral audit cryptographic streams.", imageUrl: null, order: 6 }
    ]
  },
  {
    id: 2,
    electionId: 101,
    title: "General Secretary Office",
    slots: 1,
    candidates: [
      { id: 20, positionId: 2, name: "E. Osei Tutu", teaser: "Documentation index indexing optimizations.", imageUrl: "https://unsplash.com", order: 1 },
      { id: 21, positionId: 2, name: "Serwaa Akoto Bonsu", teaser: "Integrated notification webhooks setup routing.", imageUrl: null, order: 2 },
      { id: 22, positionId: 2, name: "Kelvin Vance Atta", teaser: "Server latency reduction algorithms.", imageUrl: "https://unsplash.com", order: 3 },
      { id: 23, positionId: 2, name: "Naa Shormey Bourne", teaser: "Multi-channel USSD validation structures.", imageUrl: "https://unsplash.com", order: 4 }
    ]
  }
];

export default function LiveBallotSimulation() {
  const [voter] = useState<VoterContext>(MOCK_VOTER);
  const [ballotPositions] = useState<PositionGroup[]>(MOCK_BALLOT_STRUCTURE);
  
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ballotSuccess, setBallotSuccess] = useState(false);

  // AUTOMATED SLIDING MECHANICAL HOOK: Choice trigger handles variable mapping and shifts panel instantly
  const handleSelectCandidate = (positionId: number, candidateId: number) => {
    setSelections((prev) => ({ ...prev, [positionId]: candidateId }));
    
    // Auto-advance loop tracking parameters smoothly
    setTimeout(() => {
      if (activeStepIndex < ballotPositions.length) {
        setActiveStepIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 450); // Generates elegant visual latency duration for clicking feedback
  };

  const handleResetBallot = () => {
    setSelections({});
    setActiveStepIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalizeVotesSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      
      const electionVotesPayload = Object.entries(selections)
        .filter(([_, candidateId]) => candidateId !== -1)
        .map(([positionId, candidateId]) => ({
          electionId: voter.electionId,
          positionId: parseInt(positionId),
          candidateId: candidateId,
          receiptSignature: `sig_sha256_${crypto.randomUUID().replace(/-/g, "")}`
        }));

      console.log("Committed payload to Drizzle schema database driver context:", electionVotesPayload);
      setBallotSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showReviewSummary = activeStepIndex === ballotPositions.length;

  if (ballotSuccess) {
    return (
      <div className="w-full max-w-md mx-auto my-20 p-6 bg-zinc-950 border border-zinc-800 rounded-xl text-center font-sans animate-in Adrenaline-zoom duration-200">
        <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white tracking-tight">Ballot cast successfully</h3>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          Thank you, <span className="text-purple-400 font-semibold">{voter.name}</span>. Selections committed safely.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#18181b] text-zinc-200 font-sans p-4 md:p-6 overflow-x-hidden relative select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ================= SECURE SECURITY HEADER ================= */}
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-4 relative z-20">
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-purple-400" />
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Encrypted Ballot Terminal</h1>
              <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                Voter Account: {voter.username} · Token Hash: node_{voter.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ballotPositions.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeStepIndex ? 'w-6 bg-purple-500' : idx < activeStepIndex ? 'w-2 bg-purple-800' : 'w-2 bg-zinc-800'}`} 
              />
            ))}
            <div className={`h-1.5 rounded-full transition-all duration-300 ${showReviewSummary ? 'w-6 bg-emerald-500' : 'w-2 bg-zinc-800'}`} />
          </div>
        </div>

        {/* ================= CAROUSEL RIGHT-TO-LEFT SLIDING GRID FRAME CONTAINER ================= */}
        <div className="relative w-full overflow-hidden min-h-[500px]">
          
          {ballotPositions.map((position, posIndex) => {
            const currentSelectedId = selections[position.id];
            
            let slideTranslateClass = "translate-x-full opacity-0 pointer-events-none";
            if (posIndex === activeStepIndex) {
              slideTranslateClass = "translate-x-0 opacity-100 relative z-10 animate-in slide-in-from-right duration-300";
            } else if (posIndex < activeStepIndex) {
              slideTranslateClass = "-translate-x-full opacity-0 pointer-events-none absolute w-full top-0";
            }

            return (
              <div 
                key={position.id} 
                className={`w-full transform transition-all duration-500 ease-in-out ${slideTranslateClass}`}
              >
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-5 shadow-2xl">
                  
                  {/* Category Title bar details */}
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">{position.title}</h2>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                      Selections auto-advance instantly
                    </span>
                  </div>

                  {/* HIGH DENSITY RESPONSIVE GRID MATRIX FOR 4 - 8 CANDIDATES PANELS */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {position.candidates.map((candidate) => {
                      const isCandidateSelected = currentSelectedId === candidate.id;

                      return (
                        <div
                          key={candidate.id}
                          onClick={() => handleSelectCandidate(position.id, candidate.id)}
                          className={`border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col bg-zinc-900/10 shadow-sm relative ${isCandidateSelected ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-950/10' : 'border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/30'}`}
                        >
                          {/* Balanced Compact Image Section */}
                          <div className="w-full h-40 bg-zinc-950 border-b border-zinc-900 flex items-center justify-center relative overflow-hidden bg-zinc-900 shrink-0">
                            {candidate.imageUrl ? (
                              <img src={candidate.imageUrl} alt={candidate.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-zinc-700" />
                            )}
                            {isCandidateSelected && (
                              <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-0.5 shadow-md">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>

                          {/* High-density metadata summary footer area */}
                          <div className="p-3 space-y-1 grow flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-white tracking-wide truncate">{candidate.name}</h4>
                              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-snug mt-0.5">{candidate.teaser}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Abstain/Skip triggering button layout line */}
                  <div className="border-t border-zinc-900 pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleSelectCandidate(position.id, -1)}
                      className={`flex items-center justify-center gap-2 w-64 px-4 py-2 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-amber-400 hover:border-amber-500/40`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Abstain / Skip Portfolio</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}

          {/* ================= FINAL STEP VIEW: SUMMARY CONFIRMATION MODULE ================= */}
          {showReviewSummary && (
            <div className="w-full transform transition-all duration-500 ease-in-out translate-x-0 opacity-100 relative z-10 animate-in slide-in-from-right duration-300">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6 shadow-2xl">
                
                <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-[11px]">
                    <Fingerprint className="w-4 h-4 text-purple-400" />
                    <span>Review Final Ballot Selections</span>
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded">
                    Audit Verification
                  </span>
                </div>

                {/* Final Selection Summary Dashboard with Images */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ballotPositions.map((position) => {
                    const chosenId = selections[position.id];
                    const chosenCandidate = position.candidates.find(c => c.id === chosenId);

                    return (
                      <div key={position.id} className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3.5 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0 bg-zinc-900">
                          {chosenId !== -1 && chosenCandidate?.imageUrl ? (
                            <img src={chosenCandidate.imageUrl} alt={chosenCandidate.name} className="w-full h-full object-cover" />
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

                {/* Action buttons footer */}
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
