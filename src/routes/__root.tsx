import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'
import { ADMIN_THEME_INIT_SCRIPT } from '#/lib/admin-theme'
import { lazy, Suspense } from 'react'

// Dev-only: import.meta.env.DEV is statically false in production builds, so
// the lazy import (and all devtools code) is dropped from the client bundle.
const DevtoolsPanel = import.meta.env.DEV
  ? lazy(() => import('../integrations/devtools-panel'))
  : null

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import Header from '#/components/Header'
import Footer from '#/components/Footer'
import { NotFoundPage, RouteErrorPage } from '#/components/ErrorPage'
import { checkAuthSession } from '#/lib/auth-helper'
import { GoogleOAuthProvider } from '@react-oauth/google'


interface MyRouterContext {
  queryClient: QueryClient
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({

  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Heravote - Modern Online & Event Voting Platform For Africa',
        description: 'A next-generation platform for creating, managing, and participating in voting events and organization elections. Experience seamless voting with real-time analytics and beautiful interfaces.',
        keywords: 'voting,events,awards,competitions,USSD voting,event management,real-time analytics'
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RouteErrorPage,

  beforeLoad: async () => {
    try {
      const authState = await checkAuthSession();
      return { user: authState?.user, authenticated: authState?.authenticated };
    } catch {
      // checkAuthSession is gated by arcjetMiddleware, which throws a plain
      // Error (not a Response -- that breaks seroval SSR serialization, see
      // arcjetMiddleware.ts) whenever Arcjet blocks the request. Since this
      // runs on EVERY page's beforeLoad, an unhandled throw here crashed the
      // entire render (any bot/rate-limited/shield-tripped visitor got a
      // generic 500 "Application Error" instead of just the normal public
      // page). Fail closed to "not authenticated" instead -- the real
      // sign-in endpoint still gets its own clean 403/429 via
      // rejectIfArcjetDenied in api/auth.$.ts.
      return { user: null, authenticated: false };
    }
  },
  notFoundComponent: NotFoundPage,

})

function RootDocument({ children }: { children: React.ReactNode }) {
  // The admin has its own shell (sidebar + top bar), so the public site's
  // header and footer are not rendered there.
  const isAdmin = useRouterState({ select: (s) => s.location.pathname.startsWith('/admin') })
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT + ADMIN_THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="__variable_f367f3 __variable_dd5b2f flex flex-col justify-between font-sans antialiased bg-[#0d1f36] min-h-screen">
        {!isAdmin && <Header />}
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        {children}
        </GoogleOAuthProvider>
        {!isAdmin && <Footer />}
        {DevtoolsPanel && (
          <Suspense fallback={null}>
            <DevtoolsPanel />
          </Suspense>
        )}
        <Scripts />
      </body>
    </html>
  )
}
