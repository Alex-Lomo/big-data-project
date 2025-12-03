import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import './index.css';
import '@mantine/core/styles.css';
import App from './App.tsx';
import { MantineProvider } from '@mantine/core';
import { AppWebSocketProvider } from './components/AppWebSocketProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    await worker.start({
        onUnhandledRequest: 'bypass',
        quiet: true,
    });
}

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <MantineProvider defaultColorScheme="auto">
                <AppWebSocketProvider connectOnMount>
                    <App />
                </AppWebSocketProvider>
            </MantineProvider>
        </QueryClientProvider>
    </StrictMode>,
);
