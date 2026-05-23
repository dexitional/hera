import { DialogClose } from "./ui/dialog";

export default function VoteUSSD({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <div className="mb-3 sm:mb-4">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-phone w-3 h-3 sm:w-4 sm:h-4 text-blue-400"><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path></svg>
              <span className="text-xs sm:text-sm font-medium text-blue-400">USSD Instructions</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Vote via USSD</h2>
          <p className="text-zinc-400 text-sm">Follow these simple steps to cast your vote</p>
        </div>
        <div className="bg-slate-600/10 p-3 sm:p-4 rounded-xl border border-slate-600/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
            <span className="text-sm text-zinc-400">Nominee Code</span>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-qrcode w-4 h-4 text-purple-400"><path d="M4 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4"></path><path d="M7 17l0 .01"></path><path d="M14 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4"></path><path d="M7 7l0 .01"></path><path d="M4 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4"></path><path d="M17 7l0 .01"></path><path d="M14 14l3 0"></path><path d="M20 14l0 .01"></path><path d="M14 14l0 3"></path><path d="M14 20l3 0"></path><path d="M17 17l3 0"></path><path d="M20 17l0 3"></path></svg>
              <span className="text-sm text-purple-400">Required</span>
            </div>
          </div>
          <div className="bg-slate-800/30 p-3 rounded-lg">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-wider break-all">1585</span>
          </div>
        </div>
        <div className="bg-blue-500/10 p-3 sm:p-4 rounded-xl border border-blue-500/20">
          <div className="flex items-center gap-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-phone w-4 h-4 sm:w-5 sm:h-5 text-blue-400"><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path></svg>
            <span className="text-sm font-medium text-blue-400">Dial this code</span>
          </div>
          <div className="bg-slate-800/30 p-3 rounded-lg">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-wider">*920*401#</span>
          </div>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <span className="text-sm font-medium mb-3 text-white">Step-by-step instructions:</span>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-3 text-zinc-300">
              <div className="w-6 h-6 flex items-center justify-center bg-purple-500/20 rounded-full text-xs font-bold text-purple-400 border border-purple-500/30 shrink-0 mt-0.5">1</div>
              <span className="text-sm wrap-break-word">Dial *920*401# on your phone</span>
            </div>
            <div className="flex items-start gap-3 text-zinc-300">
              <div className="w-6 h-6 flex items-center justify-center bg-purple-500/20 rounded-full text-xs font-bold text-purple-400 border border-purple-500/30 shrink-0 mt-0.5">2</div>
              <span className="text-sm wrap-break-word">Enter nominee code: 1585</span>
            </div>
            <div className="flex items-start gap-3 text-zinc-300">
              <div className="w-6 h-6 flex items-center justify-center bg-purple-500/20 rounded-full text-xs font-bold text-purple-400 border border-purple-500/30 shrink-0 mt-0.5">3</div>
              <span className="text-sm wrap-break-word">Enter the number of votes you want to cast</span>
            </div>
            <div className="flex items-start gap-3 text-zinc-300">
              <div className="w-6 h-6 flex items-center justify-center bg-purple-500/20 rounded-full text-xs font-bold text-purple-400 border border-purple-500/30 shrink-0 mt-0.5">4</div>
              <span className="text-sm wrap-break-word">Confirm your vote selection</span>
            </div>
            <div className="flex items-start gap-3 text-zinc-300">
              <div className="w-6 h-6 flex items-center justify-center bg-purple-500/20 rounded-full text-xs font-bold text-purple-400 border border-purple-500/30 shrink-0 mt-0.5">5</div>
              <span className="text-sm wrap-break-word">Wait for SMS confirmation</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            className="w-full sm:flex-1 px-4 py-3 bg-slate-600/10 text-white rounded-xl hover:bg-slate-600/20 transition-colors text-sm font-medium border border-slate-600/20 order-2 sm:order-1"
            onClick={onBack}
          >
            Back
          </button>
          <DialogClose asChild>
            <button className="w-full sm:flex-1 px-4 py-3 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-lg order-1 sm:order-2">Got it!</button>
          </DialogClose>
        </div>
        <div className="text-center pt-2 pb-2">
          <p className="text-xs text-zinc-600">Need help? Contact support for assistance</p>
        </div>
      </div>
    </div>
  )
}
