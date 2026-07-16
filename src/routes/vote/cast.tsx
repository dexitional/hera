import LiveBallotSimulation from '#/components/election/LiveBallotSimulation';
import { useAuthStore, waitForHydration } from '#/lib/voterStore';
import { getElectionDataFn } from '#/server/tenant-elections';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// Utility to restore state from localStorage to in-memory store if needed
function restoreAuthFromStorageIfNeeded() {
  if (typeof window === 'undefined') return;
  try {
    const persisted = window.localStorage.getItem('ts_auth_session');
    if (persisted) {
      const persistedData = JSON.parse(persisted);
      const storeUser = useAuthStore.getState().user;
      if (!storeUser && persistedData?.state?.user) {
        useAuthStore.setState({ user: persistedData.state.user });
      }
    }
  } catch (e) {
    console.warn('Failed to restore voter session from localStorage:', e);
  }
}

const electionsQueryOptions = (electionId: any) => ({
  queryKey: ['election-page', electionId],
  queryFn: () => getElectionDataFn({ data: electionId }),
  enabled: !!electionId,
});

export const Route = createFileRoute('/vote/cast')({
  component: RouteComponent,
  // Voter auth lives only in the browser (zustand + localStorage) -- there's no server-side
  // voter session, so it's never safe to gate or redirect from beforeLoad/loader: on a hard
  // refresh those run server-side first, see no user, and would kick the voter out before the
  // browser gets a chance to hydrate the real session. All of that is done client-side below.
});

function LoadingShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a192a]/30">
      <Loader2 className="animate-spin text-purple-500" />
    </div>
  );
}

function RouteComponent() {
  const navigate = useNavigate();
  const [isHydrated, setIsHydrated] = useState(false);
  const user: any = useAuthStore((state) => state.user);

  // Wait for zustand's localStorage persistence to hydrate (this also covers a fresh
  // server-render, where the store starts empty until the client takes over), then
  // backfill from localStorage directly as a fallback if the persist middleware hasn't.
  useEffect(() => {
    let cancelled = false;
    waitForHydration().then(() => {
      if (cancelled) return;
      restoreAuthFromStorageIfNeeded();
      setIsHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Only once we're certain hydration finished (and localStorage genuinely had no
  // session) do we send the voter away -- never before, and never on the server.
  useEffect(() => {
    if (isHydrated && !user?.electionId) {
      navigate({ to: '/elections' });
    }
  }, [isHydrated, user?.electionId, navigate]);

  const { data, isLoading, isError, error } = useQuery(electionsQueryOptions(user?.electionId));

  if (!isHydrated || !user?.electionId) {
    return <LoadingShell />;
  }

  if (isLoading) {
    return <LoadingShell />;
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0a192a]/30 px-4 text-center">
        <p className="text-sm font-semibold text-red-400">Couldn't load your ballot.</p>
        <p className="max-w-sm text-xs text-zinc-500">
          {error instanceof Error ? error.message : "Please try signing in again."}
        </p>
        <a href="/elections" className="text-xs font-medium text-purple-400 transition-colors hover:text-purple-300">
          Return to Elections
        </a>
      </div>
    );
  }

  return <LiveBallotSimulation user={user} data={data} />;
}
