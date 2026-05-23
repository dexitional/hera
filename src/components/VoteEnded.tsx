import { DialogClose } from './ui/dialog'

export default function VoteEnded() {
  return (
    <div className="p-4 sm:p-6">
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="tabler-icon tabler-icon-alert-triangle w-5 h-5 text-red-400"
            >
              <path d="M12 9v4"></path>
              <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0"></path>
              <path d="M12 16h.01"></path>
            </svg>
            <span className="text-sm font-medium text-red-400">Voting Ended</span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Voting Has Ended</h2>
        <p className="text-zinc-400 text-sm mb-4">Voting for this event ended on 12/08/2025</p>
        <DialogClose asChild>
          <button
            className="px-6 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors text-sm font-medium"
            tabIndex={0}
          >
            Close
          </button>
        </DialogClose>
      </div>
    </div>
  )
}
