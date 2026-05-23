import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, ShieldCheck, HelpCircle, ArrowRight, 
  RotateCcw, Lock, Award, User, Layers, Fingerprint 
} from "lucide-react";

// Types matching the compiled database table definitions from your Drizzle schema
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

// Mock relational joined selection data mimicking database preloading tasks
const MOCK_VOTER: VoterContext = {
  id: 842,
  electionId: 101,
  name: "Kwame Mensah",
  username: "kwame_m",
  phoneNumber: "+233241234567",
  email: "kwame@domain.edu.gh",
  hasVoted: false,
};

const MOCK_BALLOT_STRUCTURE: PositionGroup[] = [
  {
    id: 1,
    electionId: 101,
    title: "Presidential Slot",
    slots: 1,
    candidates: [
      { id: 10, positionId: 1, name: "Jane Afia Mensah", teaser: "Transformative digital inclusion for all student groups.", imageUrl: "https://festora-bucket.internal", order: 1 },
      { id: 11, positionId: 1, name: "Michael Kwesi Koomson", teaser: "Accountable financial metrics and operational infrastructure.", imageUrl: null, order: 2 }
    ]
  },
  {
    id: 2,
    electionId: 101,
    title: "General Secretary Office",
    slots: 1,
    candidates: [
      { id: 20, positionId: 2, name: "Emmanuel Osei Tutu", teaser: "Efficient notification indexing and workspace optimizations.", imageUrl: "https://festora-bucket.internal", order: 1 },
      { id: 21, positionId: 2, name: "Serwaa Akoto Bonsu", teaser: "Bridging communication pipelines cleanly across divisions.", imageUrl: null, order: 2 }
    ]
  }
];

export default function LiveBallotSimulation() {
  // Enforce secure verification routing state parameters
  const [voter] = useState<VoterContext>(MOCK_VOTER);
  const [ballotPositions] = useState<PositionGroup[]>(MOCK_BALLOT_STRUCTURE);
  
  // Track selected candidate IDs using positionId mapping parameters
  const [selections, setSelections] = useState<Record<number, number>>({});
  
  // Controls structural visibility step limits dynamically to handle slide sequences
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ballotSuccess, setBallotSuccess] = useState(false);

  // Handles choosing a specific candidate node
  const handleSelectCandidate = (positionId: number, candidateId: number, currentPositionIndex: number) => {
    setSelections((prev) => ({
      ...prev,
      [positionId]: candidateId
    }));

    // Trigger progressive reveal animation sequence if subsequent configurations exist
    if (currentPositionIndex === activeStepIndex && activeStepIndex < ballotPositions.length - 1) {
      setTimeout(() => {
        setActiveStepIndex((prev) => prev + 1);
        // Clean utility to scroll to view layout smoothly on mobile frames
        document.getElementById(`position-block-${ballotPositions[currentPositionIndex + 1].id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 350);
    }
  };

  const handleResetBallot = () => {
    setSelections({});
    setActiveStepIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalizeVotesSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate cryptographic receipt signatures synthesis parsing variables
      await new Promise((resolve) => setTimeout(resolve, 1400));
      
      // Packaging batch relational insert query arrays matching 'election_votes' constraints
      const electionVotesPayload = Object.entries(selections).map(([positionId, candidateId]) => ({
        electionId: voter.electionId,
        positionId: parseInt(positionId),
        candidateId: candidateId,
        receiptSignature: `sig_sha256_${crypto.randomUUID().replace(/-/g, "")}` // Generating mock secure payload hash
      }));

      console.log("Committed batch cryptographic injection to Drizzle table models:", electionVotesPayload);
      setBallotSuccess(true);
    } catch (err) {
      console.error("Cryptographic ledger injection broke:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBallotComplete = ballotPositions.every((pos) => selections[pos.id] !== undefined);

  if (ballotSuccess) {
    return (
      <div className="w-full max-w-md mx-auto my-20 p-6 bg-zinc-950 border border-zinc-800 rounded-xl text-center font-sans animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Ballot Submitted Securely</h3>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          Thank you, <span className="text-purple-400 font-semibold">{voter.name}</span>. Your choices have been cryptographically signed and serialized onto the main audit ledger. Your access eligibility status has been set to closed.
        </p>
        <div className="mt-4 bg-zinc-900/60 border border-zinc-800 p-2.5 rounded text-[10px] font-mono text-zinc-500 text-left select-all truncate">
          RECEIPT_HASH: {crypto.randomUUID()}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#18181b] text-zinc-200 font-sans p-4 md:p-6 relative select-none">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* ================= SECURE SECURITY SYSTEM BANNER HEADER ================= */}
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-950/20 border border-purple-900/30 flex items-center justify-center text-purple-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Encrypted Session Terminal</h1>
              <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                Authenticated Identity: {voter.email} · Mask: voter_idx_{voter.id}
              </p>
            </div>
          </div>
          <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-sm bg-purple-950/50 border border-purple-900/40 text-purple-400 font-mono select-none">
            Secure Route
          </span>
        </div>

        {/* ================= PROGRESSIVE BALLOT POSITIONS STACK LAYER ================= */}
        <div className="space-y-8 relative">
          {ballotPositions.map((position, posIndex) => {
            const isUnlocked = posIndex <= activeStepIndex;
            const chosenCandidateId = selections[position.id];

            return (
              <div 
                key={position.id} 
                id={`position-block-${position.id}`}
                className={`transition-all duration-500 ease-in-out ${isUnlocked ? "opacity-100 scale-100 translate-y-0 animate-in fade-in slide-in-from-top-4 duration-300" : "opacity-20 scale-95 pointer-events-none filter blur-xs"}`}
              >
                <div className={`rounded-xl border p-5 space-y-4 shadow-xl ${chosenCandidateId ? 'bg-zinc-950 border-purple-500/30 ring-1 ring-purple-500/10' : 'bg-zinc-950 border-zinc-800/80'}`}>
                  
                  {/* Position Title Index Tag */}
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Award className={`w-4 h-4 ${chosenCandidateId ? 'text-purple-400' : 'text-zinc-500'}`} />
                      <h3 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider text-[11px]">{position.title}</h3>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                      Choose {position.slots} candidate
                    </span>
                  </div>

                  {/* Portfolio Candidates Choice Presentation Cards Row Group */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {position.candidates.map((candidate) => {
                      const isSelected = chosenCandidateId === candidate.id;

                      return (
                        <div
                          key={candidate.id}
                          onClick={() => handleSelectCandidate(position.id, candidate.id, posIndex)}
                          className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer relative flex items-start gap-4 select-none ${isSelected ? 'bg-purple-950/10 border-purple-500 shadow-md ring-1 ring-purple-500/20' : 'bg-zinc-900/30 border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/50'}`}
                        >
                          {/* Portrait circular placeholder with R2 source checks layout fallback */}
                          <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                            {candidate.imageUrl ? (
                              <img src={candidate.imageUrl} alt={candidate.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-zinc-600" />
                            )}
                          </div>

                          {/* Candidate Meta Info Detail Container layout element stack */}
                          <div className="space-y-1 min-w-0 pr-6">
                            <h4 className="text-xs font-bold text-white tracking-wide truncate">{candidate.name}</h4>
                            <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                              {candidate.teaser || "No bio teaser statement supplied by candidate profile configuration node."}
                            </p>
                          </div>

                          {/* Radio Check Marker Circle Component Graphic indicator */}
                          <div className="absolute right-4 top-4">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-purple-400 bg-purple-600' : 'border-zinc-700 bg-zinc-950'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* ================= CONFIRMATION VERIFICATION MODAL BAR CONTROLS ================= */}
        {isBallotComplete && (
          <div className="bg-zinc-950 border border-purple-500/20 p-5 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 relative z-20 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 to-purple-400" />
            <div className="flex items-start gap-3">
              <Fingerprint className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Finalize Cryptographic Confirmation</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
                  Verify selections before signing. Once submitted, selections are batch hashed into an immutable block sequence layer, sealing your voter access token.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-zinc-900 pt-3.5">
              <button
                type="button"
                onClick={handleResetBallot}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs font-semibold px-2 py-1.5 rounded transition-colors disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Form
              </button>

              <button
                type="button"
                onClick={handleFinalizeVotesSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg active:scale-98 disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing Ledger...
                  </>
                ) : (
                  <>
                    <span>Confirm & Cast Ballot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
