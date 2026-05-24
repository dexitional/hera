export default function Footer() {
  return (
    <>
    <footer className="relative w-full border-t border-white/10 bg-[#0a192a] backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 ">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="sm:col-span-2 -mt-7 lg:col-span-2">
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <img src="/logo512.png" alt="Heravote Logo" className="sm:h-20 -ml-3 rounded-xl" />
            </div>
            <p className="text-sm sm:text-base text-zinc-300 mb-3 sm:mb-4 max-w-md leading-relaxed">
              Secure digital voting platform for awards, elections, and competitions. Create transparent elections and voting events with real-time results.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <a
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all duration-300 w-full sm:w-auto justify-center"
                href="/auth/signin"
              >
                Get Started
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-arrow-right w-4 h-4">
                  <path d="M5 12l14 0"></path>
                  <path d="M13 18l6 -6"></path>
                  <path d="M13 6l6 6"></path>
                </svg>
              </a>
              <a
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-all duration-300 hover:bg-white/5 w-full sm:w-auto justify-center"
                href="/about"
              >
                Learn More
              </a>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="text-sm sm:text-base font-bold mb-2 sm:mb-3 text-white">
              Platform
            </div>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a className="text-sm sm:text-base text-zinc-400 hover:text-white transition-colors duration-300 flex items-center gap-2 sm:gap-3" href="/elections">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-thumb-up w-4 h-4 sm:w-5 sm:h-5"><path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3"></path></svg>
                  Goto Elections Voting 
                </a>
              </li>
              <li>
               <a className="text-sm sm:text-base text-zinc-400 hover:text-white transition-colors duration-300 flex items-center gap-2 sm:gap-3" href="/events">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-thumb-up w-4 h-4 sm:w-5 sm:h-5"><path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3"></path></svg>
                  Goto Events Voting
                </a>
              </li>
              <li>
                <a className="text-sm sm:text-base text-zinc-400 hover:text-white transition-colors duration-300 flex items-center gap-2 sm:gap-3" href="/auth/signup">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-users w-4 h-4 sm:w-5 sm:h-5"><path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path></svg>
                  Create Account
                </a>
              </li>
              {/* <li>
                <div className="text-sm sm:text-base text-zinc-400 flex items-center gap-2 sm:gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-device-mobile w-4 h-4 sm:w-5 sm:h-5"><path d="M6 5a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14"></path><path d="M11 4h2"></path><path d="M12 17v.01"></path></svg>
                  USSD Support
                </div>
              </li> */}
            </ul>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="text-sm sm:text-base font-bold mb-2 sm:mb-3 text-white">
              Company
            </div>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a className="text-sm sm:text-base text-zinc-400 hover:text-white transition-colors duration-300 flex items-center gap-2 sm:gap-3" href="/about">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-building w-4 h-4 sm:w-5 sm:h-5"><path d="M3 21l18 0"></path><path d="M9 8l1 0"></path><path d="M9 12l1 0"></path><path d="M9 16l1 0"></path><path d="M14 8l1 0"></path><path d="M14 12l1 0"></path><path d="M14 16l1 0"></path><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16"></path></svg>
                  About Us
                </a>
              </li>
              <li>
                <a className="text-sm sm:text-base text-zinc-400 hover:text-white transition-colors duration-300 flex items-center gap-2 sm:gap-3" href="/contact">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-mail w-4 h-4 sm:w-5 sm:h-5"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10"></path><path d="M3 7l9 6l9 -6"></path></svg>
                  Contact
                </a>
              </li>
              <li>
                <div className="text-sm sm:text-base text-zinc-400 flex items-center gap-2 sm:gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-shield w-4 h-4 sm:w-5 sm:h-5"><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"></path></svg>
                  Secure &amp; Trusted
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/10">
          <div className="flex flex-col items-center text-center gap-2 sm:gap-3 lg:flex-row lg:justify-between lg:items-center lg:text-left">
            <div className="text-sm sm:text-base text-zinc-400 font-medium">
              © {new Date().getFullYear()} Heravote. All rights reserved.
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 lg:gap-4">
              <div className="text-sm sm:text-base text-zinc-500 font-medium">
                Trusted by leading institutions
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white/10 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-check w-4 h-4 text-green-400">
                    <path d="M5 12l5 5l10 -10"></path>
                  </svg>
                </div>
                <span className="text-sm sm:text-base text-zinc-400 font-medium">
                  Secure Platform
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
    <button
      className="fixed bottom-6 right-6 z-50 p-4 bg-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      tabIndex={0}
    >
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
        className="tabler-icon tabler-icon-message-circle w-6 h-6"
      >
        <path d="M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1"></path>
      </svg>
    </button>
    </>
  )
}