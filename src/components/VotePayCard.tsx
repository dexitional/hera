type PayPage = 'card' | 'ussd' | 'ended' | 'stack'

export default function VotePayCard({ onSelectMode }: { onSelectMode: (p: PayPage) => void }) {
  
  return (
    <div className="max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
            <div className="text-center mb-6 sm:mb-8">
            <div className="mb-3 sm:mb-4">
                <div className="inline-flex items-center gap-2 bg-purple-500/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-purple-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-thumb-up w-3 h-3 sm:w-4 sm:h-4 text-purple-400">
                    <path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3"></path>
                </svg>
                <span className="text-xs sm:text-sm font-medium text-purple-400">Cast Your Vote</span>
                </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Vote for Patrick Annan and Vanessa Ekua Dadzie </h2>
            <p className="text-zinc-400 text-sm">Choose your preferred voting method below</p>
            </div>
            <div className="space-y-3 sm:space-y-4 mb-6">
            <button className="w-full group" tabIndex={0} onClick={() => onSelectMode('stack')}>
                <div className="bg-linear-to-r from-purple-600 to-blue-600 p-4 sm:p-5 rounded-xl sm:rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 aspect-square bg-white/10 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-credit-card w-7 h-7 sm:w-8 sm:h-8 text-white">
                        <path d="M3 8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3l0 -8"></path>
                        <path d="M3 10l18 0"></path>
                        <path d="M7 15l.01 0"></path>
                        <path d="M11 15l2 0"></path>
                        </svg>
                    </div>
                    <div className="text-left">
                        <h3 className="text-white font-bold text-base sm:text-lg">Bulk Voting</h3>
                        <p className="text-white/80 text-xs sm:text-sm">Vote multiple times with card payment and Mobile Money</p>
                    </div>
                    </div>
                    <div className="bg-white/20 px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                    <span className="text-white text-xs font-medium">Multiple</span>
                    </div>
                </div>
                </div>
            </button>
            <button className="w-full group" tabIndex={0} onClick={() => onSelectMode('ussd')}>
                <div className="bg-slate-600/10 p-4 sm:p-5 rounded-xl sm:rounded-2xl hover:bg-slate-600/20 transition-all duration-300 border border-slate-600/20 hover:border-slate-600/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-600/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-phone w-5 h-5 sm:w-6 sm:h-6 text-slate-300">
                        <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
                        </svg>
                    </div>
                    <div className="text-left">
                        <h3 className="text-white font-bold text-base sm:text-lg">USSD Voting</h3>
                        <p className="text-slate-300 text-xs sm:text-sm">Vote directly from your phone</p>
                    </div>
                    </div>
                    <div className="bg-slate-600/20 px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                    <span className="text-slate-300 text-xs font-medium">*920*401#</span>
                    </div>
                </div>
                </div>
            </button>
            </div>
        </div>
    </div>
  )
}
