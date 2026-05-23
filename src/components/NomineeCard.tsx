export default function NomineeCard() {
  return (
    <div className=" overflow-y-auto max-h-[90vh] custom-scrollbar">
      <div className=" relative bg-[#18181b]">
        <div className=" absolute inset-0">
          <div className=" absolute top-0 left-0 w-full h-full bg-[#18181b]"></div>
          <div className=" absolute right-0 bottom-0 w-48 h-48 opacity-20">
            <div className=" w-full h-full grid grid-cols-8 gap-1">
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  className=" w-1 h-1 rounded-full bg-white"
                ></div>
              ))}
            </div>
          </div>
        </div>
        <div className=" relative p-4 md:p-8">
          <div className=" flex flex-col md:flex-row gap-6 md:gap-8">
            <div className=" flex-shrink-0 flex flex-col items-center w-full md:w-52 pt-2">
              <div className=" mb-6">
                <div className=" bg-zinc-900 px-4 py-2 rounded-full border border-white/5">
                  <h3 className=" text-xs font-medium text-white tracking-wider uppercase">
                    ENSSA UCC DINNER &amp; AWARDS NIGHT&#39;25 (Cena de las Estrellas)
                  </h3>
                </div>
              </div>
              <div className=" relative mb-6">
                <div className=" absolute inset-0 -m-1 bg-blue-500/20 rounded-full blur-sm"></div>
                <div className=" relative w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-white/10 overflow-hidden">
                  <img
                    alt="Seth "
                    loading="lazy"
                    decoding="async"
                    className="object-cover object-[center_20%] rounded-full"
                    src="https://res.cloudinary.com/dm4pbkgma/image/upload/v1752444866/nominees/nominee_686915970e9be31b4cc967c4.jpg"
                    style={{
                      position: "absolute",
                      height: "100%",
                      width: "100%",
                      inset: 0,
                      color: "transparent",
                    }}
                  />
                  <div className=" absolute inset-0 bg-black/20 mix-blend-overlay rounded-full"></div>
                </div>
              </div>
              <div className=" text-center space-y-2">
                <h2 className=" text-xl font-bold text-white tracking-tight">Seth </h2>
                <p className=" text-sm text-zinc-400">Just a boy🌚</p>
                <div className=" flex items-center justify-center gap-2 text-xs"></div>
              </div>
            </div>
            <div className=" flex-1 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
              <div className=" space-y-6 md:space-y-8">
                <div className="">
                  <div className=" inline-flex flex-col items-start gap-2">
                    <div className=" bg-zinc-900 px-4 py-3 rounded-2xl border border-white/5">
                      <div className=" flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-phone w-5 h-5 text-blue-400"><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path></svg>
                        <span className=" text-xl font-bold text-white tracking-widest">4288</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className=" space-y-3">
                  <span className=" text-xs text-zinc-500 uppercase tracking-wider">How to Vote</span>
                  <div className=" space-y-3">
                    <div className=" flex items-center gap-3 text-zinc-300">
                      <span className=" w-6 h-6 flex items-center justify-center bg-zinc-900 rounded-full text-xs font-bold text-white border border-white/5">1</span>
                      <span className=" text-sm">Dial *920*401#</span>
                    </div>
                    <div className=" flex items-center gap-3 text-zinc-300">
                      <span className=" w-6 h-6 flex items-center justify-center bg-zinc-900 rounded-full text-xs font-bold text-white border border-white/5">2</span>
                      <span className=" text-sm">Enter nominee code: 2123</span>
                    </div>
                    <div className=" flex items-center gap-3 text-zinc-300">
                      <span className=" w-6 h-6 flex items-center justify-center bg-zinc-900 rounded-full text-xs font-bold text-white border border-white/5">3</span>
                      <span className=" text-sm">Enter Number of Votes</span>
                    </div>
                    <div className=" flex items-center gap-3 text-zinc-300">
                      <span className=" w-6 h-6 flex items-center justify-center bg-zinc-900 rounded-full text-xs font-bold text-white border border-white/5">4</span>
                      <span className=" text-sm">Confirm your vote</span>
                    </div>
                    <div className=" flex items-center gap-3 text-zinc-300">
                      <span className=" w-6 h-6 flex items-center justify-center bg-zinc-900 rounded-full text-xs font-bold text-white border border-white/5">5</span>
                      <span className=" text-sm">Wait for SMS confirmation</span>
                    </div>
                  </div>
                </div>
                <div className=" mt-6 space-y-3">
                  <span className=" text-xs text-zinc-500 uppercase tracking-wider">Nominee Profile</span>
                  <div className=" flex items-center gap-2 bg-zinc-900/50 rounded-xl p-3 border border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-link w-4 h-4 text-blue-400"><path d="M9 15l6 -6"></path><path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464"></path><path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"></path></svg>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-blue-400 hover:text-blue-300 transition-colors truncate"
                      href="https://heravote.com/nominee/2123"
                    >
                      heravote.com/nominee/2123
                    </a>
                    <button
                      title="Copy link"
                      className=" p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-copy w-4 h-4 text-zinc-400"><path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666"></path><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className=" space-y-4 mt-6 md:mt-8">
                <div className=" flex justify-center">
                  <button className=" px-6 py-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors text-sm font-medium border border-white/10">
                    Close
                  </button>
                </div>
                <div className=" text-center">
                  <p className=" text-xs text-zinc-600">Powered by Heravote</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
