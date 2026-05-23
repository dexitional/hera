export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#0a192a] border-b border-[#23232b] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between rounded-b-3xl">
        <a className="flex items-center gap-2" href="/">
          <img
            alt="logo"
            className="h-20 -ml-2.5 sm:ml-0 md:ml-0 lg:ml-0"
            src="/logo512.png"
          />
        </a>
        <div className="hidden lg:flex items-center gap-8 ml-8">
          <a className="text-base font-medium transition-colors text-white hover:text-purple-400" href="/about">
            About
          </a>
          {/* <a className="text-base font-medium transition-colors text-white hover:text-purple-400" href="/blog">
            Blog
          </a> */}
          <a className="text-base font-medium transition-colors text-white hover:text-purple-400" href="/contact">
            Contact
          </a>
          {/* <a className="text-base font-medium transition-colors text-white hover:text-purple-400 flex items-center gap-2" href="/tickets">
            Tickets
            <span className="px-2 py-0.5 text-xs font-bold bg-purple-600 text-white rounded-full">NEW</span>
          </a> */}
          {/* <a className="text-base font-medium transition-colors text-purple-400" href="/store">
            Store
          </a> */}
        </div>
        <div className="hidden md:flex items-center gap-2 mx-6">
          <div className="relative">
            <input
              placeholder="Vote in events by code"
              className="w-60 px-3 py-3 bg-transparent border border-slate-600/30 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-all"
              type="text"
              value=""
            />
          </div>
          <button className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors" title="Vote">
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
              className="tabler-icon tabler-icon-thumb-up w-6 h-6"
            >
              <path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" />
            </svg>
          </button>
        </div>
        <button className="md:hidden p-0 rounded-lg text-white hover:bg-slate-800/50 transition-colors">
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
            className="tabler-icon tabler-icon-menu-2 w-6 h-6"
          >
            <path d="M4 6l16 0" />
            <path d="M4 12l16 0" />
            <path d="M4 18l16 0" />
          </svg>
        </button>
        <div className="hidden md:flex items-center gap-3">
          {/* <a
            className="px-5 py-2 rounded-full border-2 border-purple-500 text-purple-200 font-semibold text-base hover:bg-purple-900/30 transition-colors"
            href="/events"
          >
            Events
          </a> */}

          <a
            className="px-5 py-2 rounded-full border-2 border-purple-500 text-purple-200 font-semibold text-base hover:bg-purple-900/30 transition-colors"
            href="/elections"
          >
            Elections
          </a>
          {/* <a
            className="px-5 py-2 rounded-full border-2 border-purple-500 text-purple-200 font-semibold text-base hover:bg-purple-900/30 transition-colors"
            href="/events"
          >
            Elections
          </a> */}
          <a
            className="px-5 py-2 rounded-full bg-[#E3F09B] text-black font-semibold text-base hover:bg-purple-700 transition-colors"
            href="/auth/signin"
          >
            Sign In
          </a>
          <a
            className="px-5 py-2 rounded-full bg-[#E3F09B] text-black font-semibold text-base hover:bg-purple-700 transition-colors"
            href="/admin"
          >
            Dashboard test nice
          </a>
        </div>
      </div>
      <div className="md:hidden bg-[#18181b] border-b border-[#23232b]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                placeholder="Enter nominee code to vote"
                className="w-full px-4 py-3 bg-slate-800/30 border border-slate-600/30 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
                type="text"
                value=""
              />
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
                className="tabler-icon tabler-icon-search absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none"
              >
                <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                <path d="M21 21l-6 -6" />
              </svg>
            </div>
            <button className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl transition-all font-medium text-sm shadow-lg hover:shadow-purple-500/25 flex items-center gap-2" title="Vote">
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
                className="tabler-icon tabler-icon-thumb-up w-5 h-5"
              >
                <path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" />
              </svg>
              <span className="hidden sm:inline">Vote</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
