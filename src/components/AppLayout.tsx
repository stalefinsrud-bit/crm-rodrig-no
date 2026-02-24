import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { HelpPanel } from '@/components/HelpPanel';
import { OnboardingWalkthrough } from '@/components/OnboardingWalkthrough';
import { useOnboarding } from '@/hooks/useOnboarding';
import awtLogo from '@/assets/awt-logo.svg';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { markComplete } = useOnboarding();
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <HelpPanel onRelaunchWalkthrough={() => setWalkthroughOpen(true)} />
              <img src={awtLogo} alt="AWT" className="h-5 w-auto" />
            </div>
          </header>
          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
      {walkthroughOpen && (
        <OnboardingWalkthrough
          onComplete={() => { markComplete(); setWalkthroughOpen(false); }}
          onSkip={() => { markComplete(); setWalkthroughOpen(false); }}
        />
      )}
    </SidebarProvider>
  );
}
