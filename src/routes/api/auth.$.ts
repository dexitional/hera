import { createFileRoute } from '@tanstack/react-router';
import { auth } from '../../lib/auth';

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      // 1. Handle preflight OPTIONS requests
      OPTIONS: async ({ request }) => {
        const origin = request.headers.get('origin');
        
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '600',
          },
        });
      },
      
      // 2. Upgrade GET requests with dynamic CORS headers
      GET: async ({ request }) => {
        const response = await auth.handler(request);
        const origin = request.headers.get('origin');
        
        if (origin) {
          response.headers.set('Access-Control-Allow-Origin', origin);
          response.headers.set('Access-Control-Allow-Credentials', 'true');
        }
        return response;
      },
      
      // 3. Upgrade POST requests with dynamic CORS headers
      POST: async ({ request }) => {
        const response = await auth.handler(request);
        const origin = request.headers.get('origin');
        
        if (origin) {
          response.headers.set('Access-Control-Allow-Origin', origin);
          response.headers.set('Access-Control-Allow-Credentials', 'true');
        }
        return response;
      },
    },
  },
});
