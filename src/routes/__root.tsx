import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import Header from '#/components/Header'
import Footer from '#/components/Footer'
import { ErrorComponent } from '@tanstack/react-router'
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
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: ({ error }: ErrorComponentProps) => {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: 'red' }}>
        <h2>Application Error</h2>
        <ErrorComponent error={error} />
      </div>
    );
  },

  beforeLoad: async () => {
    const authState = await checkAuthSession();
    return { user: authState?.user, authenticated: authState?.authenticated };
  },
  notFoundComponent: () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a192a] text-white p-6">
        <h2 className="text-xl font-bold">404 - Page Directory Not Found</h2>
        <p className="text-xs text-zinc-400 mt-2">The route path could not be resolved cleanly.</p>
        <a href="/admin/elections" className="mt-4 px-4 py-2 bg-purple-600 rounded text-xs">
          Return to Elections
        </a>
      </div>
    )
  },

})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="__variable_f367f3 __variable_dd5b2f flex flex-col justify-between font-sans antialiased bg-[#0a192a]/60 min-h-screen">
        <Header />
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        {children}
        </GoogleOAuthProvider>
        <Footer />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
