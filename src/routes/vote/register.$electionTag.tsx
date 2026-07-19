import { exportVoterNamesFn, getElectionByTagFn, getElectionRegistrationStatsFn, searchVotersFn } from '#/server/tenant-elections'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, Navigate } from '@tanstack/react-router'
import { ArrowLeft, Download, Search, User, Users, BarChart3, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const electionQueryOptions = (tag: any) => ({
  queryKey: ['election-page', tag],
  queryFn: () => getElectionByTagFn({ data: tag }),
})

const registrationStatsQueryOptions = (electionTag: any) => ({
  queryKey: ['election-registration-stats', electionTag],
  queryFn: () => getElectionRegistrationStatsFn({ data: electionTag } as any),
  refetchInterval: 30 * 1000,
})

const votersSearchQueryOptions = (electionTag: any, searchQuery: string) => ({
  queryKey: ['voter-lookup', electionTag, searchQuery],
  queryFn: () => searchVotersFn({ data: { electionTag, searchQuery } } as any),
  enabled: searchQuery.trim().length >= 2,
})

export const Route = createFileRoute('/vote/register/$electionTag')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { electionTag } = params
    return await context.queryClient.ensureQueryData(electionQueryOptions(electionTag))
  },
})

function RouteComponent() {
  const { electionTag } = Route.useParams()
  const { data }: any = useSuspenseQuery(electionQueryOptions(electionTag))

  // Voter lookup is only reachable when the election admin has opted in via
  // "show feed" -- same visibility flag the live results/audit feed uses.
  if (!data?.length || !data[0]?.showFeed) return <Navigate to="/elections" />

  return <VoterLookup election={data[0]} />
}

function VoterLookup({ election }: any) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const { data: results, isFetching } = useQuery(votersSearchQueryOptions(election.tag, debouncedSearchQuery))
  const voters: any[] = results ?? []

  const { data: stats } = useQuery(registrationStatsQueryOptions(election.tag))
  const totalVoters = stats?.totalVoters ?? 0
  const votesCast = stats?.votesCast ?? 0
  const turnoutPercentage = totalVoters > 0 ? ((votesCast / totalVoters) * 100).toFixed(2) : '0.00'

  const handleExportNames = async () => {
    try {
      setIsExporting(true)
      const result: any = await exportVoterNamesFn({ data: election.tag } as any)

      if (!result.success || !result.base64Data) {
        alert(result.error || 'Export failed to execute correctly.')
        return
      }

      const byteCharacters = atob(result.base64Data)
      const byteArrays = []
      const sliceSize = 512

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize)
        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }
        byteArrays.push(new Uint8Array(byteNumbers))
      }

      const fileBlob = new Blob(byteArrays, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const downloadUrl = window.URL.createObjectURL(fileBlob)
      const linkElement = document.createElement('a')

      linkElement.href = downloadUrl
      linkElement.download = result.filename
      document.body.appendChild(linkElement)
      linkElement.click()

      document.body.removeChild(linkElement)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err: any) {
      console.error('Voter names export failed:', err)
      alert(err?.message || 'Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="relative">
      <div className="min-h-screen text-white antialiased font-sans">
        <main className="w-full">
          <section className="w-full max-w-2xl mx-auto sm:mt-24 px-4 sm:px-10 lg:px-6 pt-6 pb-8 animate-in fade-in zoom-in-95 duration-500">
            <Link
              to="/vote/election"
              search={{ page: election.tag }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
            </Link>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-slate-600/10 border border-slate-600/20 p-4 flex items-center gap-3">
                <Users className="w-7 h-7 text-purple-400 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Registered Voters</p>
                  <p className="text-xl font-black text-white font-mono">{totalVoters.toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-600/10 border border-slate-600/20 p-4 flex items-center gap-3">
                <BarChart3 className="w-7 h-7 text-purple-400 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Turnout</p>
                  <p className="text-xl font-black text-white font-mono">{turnoutPercentage}%</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportNames}
              disabled={isExporting || totalVoters === 0}
              className="w-full mb-4 flex items-center justify-center gap-2 bg-blue-950/30 hover:bg-blue-900/40 border border-blue-900/40 text-xs px-3.5 py-2.5 rounded-lg font-medium text-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing download...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Download Registered Voter Names (Excel)</span>
                </>
              )}
            </button>

            <div className="bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 rounded-3xl p-8 shadow-xl">
              <div className="mb-6">
                <h2 className="text-base sm:text-xl italic font-bold tracking-wide text-white mb-2 font-sans">
                  FIND YOUR VOTER ID
                </h2>
                <p className="text-zinc-400 font-bold text-sm">{election?.title}</p>
                <p className="text-zinc-500 text-xs mt-2">
                  Search your name to look up the Voter ID you'll need to log in and vote.
                </p>
              </div>

              <div className="group relative mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-4 h-4 text-zinc-900" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 p-3.5 bg-white text-zinc-900 font-medium text-sm border-2 border-zinc-900 focus:outline-none focus:ring-0 focus:border-purple-600 transition-colors duration-200 ease-in-out"
                    placeholder="Enter your full name"
                  />
                  <div className="absolute top-0 left-0 w-full h-full bg-zinc-200 -z-10 translate-x-1.5 translate-y-1.5 border-2 border-transparent transition-transform group-focus-within:translate-x-2.5 group-focus-within:translate-y-2.5"></div>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                {debouncedSearchQuery.length < 2 ? (
                  <p className="text-center text-xs text-zinc-500 italic py-6">
                    Type at least 2 characters of your name to search.
                  </p>
                ) : isFetching ? (
                  <p className="text-center text-xs text-zinc-500 italic py-6 animate-pulse">Searching...</p>
                ) : voters.length > 0 ? (
                  voters.map((voter: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-slate-600/10 border border-slate-600/20 rounded-xl px-4 py-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-purple-950/30 border border-purple-900/30 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{voter.name}</p>
                        <p className="text-xs text-zinc-400 font-mono">
                          Voter ID: <span className="text-purple-400 select-all">{voter.username}</span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-zinc-500 italic py-6">
                    No matching voters found for this election.
                  </p>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </main>
  )
}
