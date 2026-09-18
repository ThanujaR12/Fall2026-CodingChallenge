// Client entry point: data cache, router, sign-in state, and toast notifications wrap the app.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError, wakeServer } from '@/api/client';
import { ServerWakeNotice } from '@/components/ServerWakeNotice';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/features/auth/AuthProvider';
import App from './App';
import './index.css';

const queryClient: QueryClient = new QueryClient({
  // If the server says a role no longer allows an action (e.g. the owner changed it), reload
  // everything so the screen stops offering controls the user can't use.
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof ApiError && (error.code === 'FORBIDDEN' || error.status === 404)) {
        void queryClient.invalidateQueries();
      }
    },
  }),
  defaultOptions: {
    queries: {
      // Retry once for network or server hiccups, never for "not found" or invalid requests.
      retry: (failureCount, error) =>
        failureCount < 1 &&
        !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      refetchOnWindowFocus: false,
    },
  },
});

wakeServer();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
        <Toaster position="bottom-center" />
        <ServerWakeNotice />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
