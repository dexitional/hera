import { signOut } from '#/lib/auth-client';
import { Link, useLocation, useParams } from '@tanstack/react-router';
import {
  ArrowBigRightDash,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  User2Icon,
  X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';


export default function DashboardHeader({ user }: any) {

  const pathname:any = useLocation({ select: (location: any) => location.pathname });
  const pathSegments = pathname.split('/')?.filter(Boolean);
  const currentPageName = pathSegments[pathSegments.length - 1] || 'Home';
  const params = useParams({  strict: false });
  
  
  
  // Dropdown UI states
  const [activeDropdown, setActiveDropdown] = useState(null); // 'help' | 'advisor' | 'profile' | null
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for checking clicks outside to automatically close menus
  const helpRef:any = useRef(null);
  const advisorRef:any = useRef(null);
  const profileRef:any = useRef(null);

  // Toggle dropdown helper
  const toggleDropdown = (menuName: any) => {
    setActiveDropdown((prev) => (prev === menuName ? null : menuName));
  };
  

  // Listen for clicks outside open dropdown menus
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (activeDropdown === 'help' && helpRef.current && !helpRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (activeDropdown === 'advisor' && advisorRef.current && !advisorRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (activeDropdown === 'profile' && profileRef.current && !profileRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // Global keyboard shortcut hook for ⌘K or Ctrl+K
  useEffect(() => {
    function handleKeyDown(e:any) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsFeedbackOpen(false);
        setActiveDropdown(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  return (
    <>
    <header className="hidden md:flex h-11 md:h-12 items-center shrink-0 bg-[#18181b][#0a192a]/80 border-b border-[#23232b] relative z-40 print:hidden">
    <div className="@container max-w-[1200px] px-4 @lg:px-6 @xl:px-10 mx-auto w-full flex items-center justify-between h-full pr-3 flex-1 gap-x-8 pl-4">
      
      {/* Breadcrumb / Brand Node */}
      <div className="hidden md:flex items-center text-sm">
        {/* Home */}
        <Link to={`/admin`} className="items-center justify-center shrink-0 flex" href="/admin/">
          <span className="font-bold tracking-tight text-white hover:text-zinc-200 transition-colors">Dashboard</span>
        </Link>

        {/* Elections console */}
        { ['candidates','voters','positions','manage','feed'].includes(currentPageName) && (
        <div className="flex items-center md:pl-2">
          <span className="text-zinc-600 pr-2 select-none">
            <ArrowBigRightDash className="h-4 w-4" />
          </span>
          {['candidates','voters','positions'].includes(currentPageName) ? (
            <Link className="items-center justify-center shrink-0 flex" to="/admin/elections/$electionId/manage" params={{ electionId: params?.electionId as string }}>
              <span className="font-bold tracking-tight text-zinc-400 hover:text-zinc-200 transition-colors">Elections Console</span>
            </Link>
          ) : (
            <Link className="items-center justify-center shrink-0 flex" to="/admin/elections">
              <span className="font-bold tracking-tight text-zinc-400 hover:text-zinc-200 transition-colors">Elections Console</span>
            </Link>
          )}
        </div>
        )}

        {/* Manage Election */}
        {/* { ['candidates','voters','positions'].includes(currentPageName) && params?.electionId && (
        <div className="flex items-center md:pl-2">
          <span className="text-zinc-600 pr-2 select-none">
            <ArrowBigRightDash className="h-4 w-4" />
          </span>
          <a className="items-center justify-center shrink-0 flex" href="/admin/">
            <span className="font-bold tracking-tight text-zinc-400 hover:text-zinc-200 transition-colors">Manage Election</span>
          </a>
        </div>
        )} */}


         {/* Election Centre */}
         { ['candidates','voters','positions','feed','new'].includes(currentPageName) && params?.electionId && (
        <div className="flex items-center md:pl-2">
          <span className="text-zinc-600 pr-2 select-none">
            <ArrowBigRightDash className="h-4 w-4" />
          </span>
          <Link to="/admin/elections/$electionId/manage" params={{ electionId: params?.electionId as string }} className="items-center justify-center shrink-0 flex" >
            <span className="font-bold tracking-tight text-zinc-400 hover:text-zinc-200 transition-colors">Election Centre</span>
          </Link>
        </div>
        )}
        
        
        <div className="flex items-center md:pl-2">
          <span className="text-zinc-600 pr-2 select-none">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M16 3.549L7.12 20.600"></path>
            </svg>
          </span>
          <span className="text-zinc-400 text-xs font-medium capitalize">{currentPageName}</span>
        </div>



      </div>

      {/* Controls Panel Layout */}
      <div className="flex items-center gap-x-2 ml-auto">
        
        {/* Feedback Trigger */}
        {/* <span 
          onClick={() => setIsFeedbackOpen(true)}
          className="relative justify-center cursor-pointer inline-flex items-center text-center font-normal transition-all border border-transparent hover:bg-zinc-900 text-xs px-2.5 py-1 rounded-full h-[32px] text-zinc-400 hover:text-white select-none"
          tabIndex={0}
        >
          <span className="truncate">Feedback</span>
        </span> */}

        <div className="flex items-center gap-1 md:gap-2">
          
          {/* Search Shortcut Button */}
          {/* <button 
            type="button" 
            onClick={() => setIsSearchOpen(true)}
            className="px-4 py-2 border border-zinc-800 text-sm group h-[30px] pl-1.5 md:pl-2 pr-2 items-center justify-between text-zinc-400 hover:bg-zinc-900 hover:border-zinc-700 focus:outline-none transition hidden md:flex md:min-w-32 xl:min-w-32 rounded-full bg-transparent"
          >
            <div className="w-32 flex items-center space-x-1.5">
              <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              <p className="text-xs pr-2 text-zinc-500">Search...</p>
            </div>
            <span aria-hidden="true">
              <span className="whitespace-nowrap shrink-0 items-center text-[10px] bg-zinc-800 border border-zinc-700 rounded px-[5px] py-[1.5px] text-zinc-400 font-mono shadow-sm">
                ⌘K
              </span>
            </span>
          </button> */}

          {/* Help Center Popover */}
          {/* <div className="relative" ref={helpRef}>
            <button 
              type="button" 
              onClick={() => toggleDropdown('help')}
              className={`relative cursor-pointer transition-all border text-zinc-200 bg-transparent rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 group ${activeDropdown === 'help' ? 'border-zinc-500 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-600'}`}
            > 
              <CircleHelp className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
              <span className="sr-only">Help</span>
            </button>

            {activeDropdown === 'help' && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-[#0a192a] p-1 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <a href="/docs" className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors">
                  <BookOpen className="w-4 h-4 text-zinc-500" /> Documentation
                </a>
                <a href="/support" className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors">
                  <LifeBuoy className="w-4 h-4 text-zinc-500" /> Contact Support
                </a>
              </div>
            )}
          </div> */}

          {/* Advisor Popover */}
          {/* <div className="relative" ref={advisorRef}>
            <button 
              type="button" 
              onClick={() => toggleDropdown('advisor')}
              className={`relative cursor-pointer transition-all border text-zinc-200 bg-transparent rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 group ${activeDropdown === 'advisor' ? 'border-zinc-500 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-600'}`}
            > 
              <Lightbulb className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
              <span className="sr-only">Advisor Center</span>
            </button>

            {activeDropdown === 'advisor' && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-800 bg-[#0a192a] p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">System Advisory</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Your active voting event has reached 84% turnout capacity. Consider upgrading your metrics.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div> */}
        </div>

        {/* Profile Menu Dropdown */}
        
        <span className="relative justify-center cursor-pointer inline-flex items-center text-center font-normal transition-all border border-transparent hover:bg-zinc-900 text-xs px-2.5 py-1 rounded-full h-[32px] text-zinc-400 hover:text-white select-none">
          <span className="truncate">{user?.name}</span>
        </span>

        <div className="relative ml-1 z-50" ref={profileRef}>
         
          <button 
            type="button" 
            onClick={() => toggleDropdown('profile')}
            className="relative justify-center cursor-pointer items-center transition-all bg-[#0a192a] hover:bg-zinc-800 border-[#E3F09B] hover:border-white border-[0.5px] shrink-0 flex rounded-full overflow-hidden h-8 w-8"
          > 
            <div className="bg-[#0a192a] text-[#0a192a] flex items-center justify-center w-full h-full rounded-full font-bold text-xs select-none overflow-hidden">
              {user?.image ? (
                <img src={user.image} alt={user?.name || "Profile"} className="w-full h-full object-cover" />
              ) : (
                <User2Icon className="h-4 text-[#E3F09B]"/>
              )}
            </div>
          </button>

          {activeDropdown === 'profile' && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-[#0a192a]/90 p-1 shadow-2xl z-50 divide-y divide-zinc-900 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-2">
                <p className="text-xs font-medium text-white"> {user?.name}</p>
                <p className="text-[11px] text-zinc-500 truncate"> {user?.email}</p>
              </div>
              <div className="py-1">
                <a href="/admin/settings" className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors">
                  <Settings className="w-4 h-4 text-zinc-500" /> Account Settings
                </a>
              </div>
              <div className="pt-1">
                <button 
                  onClick={ async () => {
                    await signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          window.location.href = "/auth/signin";
                        },
                      },
                    });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  </header>

   {/* Command Search Palette Backdrop (⌘K) */}
   {isSearchOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-[15vh] z-50 px-4 duration-200">
          <div className="bg-[#0a192a] border border-zinc-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center border-b border-zinc-900 px-3 py-2.5">
              <Search className="w-4 h-4 text-zinc-500 mr-2" />
              <input 
                type="text" 
                autoFocus
                placeholder="Search resources, elections, documentation..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none py-1"
              />
              <button onClick={() => setIsSearchOpen(false)} className="text-zinc-500 hover:text-zinc-300 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 text-xs text-zinc-500">
              {searchQuery ? `Showing results for "${searchQuery}"` : 'Type to search across workspaces'}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 px-4 duration-200">
          <div className="bg-[#0a192a] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-5 relative animate-in zoom-in-95 duration-150">
            <button onClick={() => setIsFeedbackOpen(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" /> Share Feedback
            </h3>
            <textarea 
              rows={4} 
              placeholder="What can we improve in Festora?" 
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mt-3 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setIsFeedbackOpen(false)} className="px-3 py-1.5 border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-900 rounded-md transition-colors">
                Cancel
              </button>
              <button onClick={() => { setIsFeedbackOpen(false); console.log('Feedback submitted'); }} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs text-white font-semibold rounded-md transition-all shadow-md">
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
  </>
  )
}
