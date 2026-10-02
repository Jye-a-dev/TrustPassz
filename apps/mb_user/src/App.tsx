import React, { useEffect, useState } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from './stores/useAuthStore';
import { ServerStatusBar } from './components/common/ServerStatusBar';
import { AppHeader } from './components/common/AppHeader';
import { GreetingScreen } from './screens/auth/GreetingScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { HomeScreen } from './screens/main/HomeScreen';
import { DealRoomScreen } from './screens/main/DealRoomScreen';
import { DisputeScreen } from './screens/main/DisputeScreen';
import type { Deal } from './types';

type ScreenState = 'GREETING' | 'LOGIN' | 'HOME' | 'DEAL_ROOM' | 'DISPUTE';

export const App: React.FC = () => {
  const { user, isInitialized, initAuth } = useAuthStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('GREETING');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
    if (Capacitor.isPluginAvailable('StatusBar')) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#080C14' }).catch(() => {});
    }
  }, [initAuth]);

  useEffect(() => {
    if (!isInitialized) return;
    const hasSeenGreeting = localStorage.getItem('trustpassz_seen_greeting');

    if (!user) {
      setCurrentScreen(hasSeenGreeting ? 'LOGIN' : 'GREETING');
    } else {
      setCurrentScreen('HOME');
    }
  }, [user, isInitialized]);

  const handleFinishGreeting = () => {
    localStorage.setItem('trustpassz_seen_greeting', 'true');
    setCurrentScreen(user ? 'HOME' : 'LOGIN');
  };

  const handleSelectDeal = (deal: Deal) => {
    setSelectedDealId(deal.id);
    setCurrentScreen('DEAL_ROOM');
  };

  const handleOpenDispute = (dealId?: string) => {
    if (dealId) setSelectedDealId(dealId);
    setCurrentScreen('DISPUTE');
  };

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#080C14] text-slate-400 font-mono text-xs">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>TrustPassz Escrow Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#080C14] text-slate-100 safe-top safe-bottom overflow-hidden">
      <ServerStatusBar />

      {currentScreen !== 'GREETING' && currentScreen !== 'LOGIN' && (
        <AppHeader
          title={
            currentScreen === 'DEAL_ROOM'
              ? 'Bàn Đàm Phán'
              : currentScreen === 'DISPUTE'
              ? 'Trọng Tài AI'
              : 'TrustPassz'
          }
          showBack={currentScreen !== 'HOME'}
          onBack={() => setCurrentScreen('HOME')}
        />
      )}

      <main className="flex-1 overflow-hidden relative">
        {currentScreen === 'GREETING' && (
          <GreetingScreen onContinue={handleFinishGreeting} />
        )}

        {currentScreen === 'LOGIN' && (
          <LoginScreen onSuccess={() => setCurrentScreen('HOME')} />
        )}

        {currentScreen === 'HOME' && (
          <HomeScreen
            onSelectDeal={handleSelectDeal}
            onOpenDisputeFlow={() => handleOpenDispute()}
          />
        )}

        {currentScreen === 'DEAL_ROOM' && selectedDealId && (
          <DealRoomScreen
            dealId={selectedDealId}
            onBack={() => setCurrentScreen('HOME')}
            onOpenDispute={(id) => handleOpenDispute(id)}
          />
        )}

        {currentScreen === 'DISPUTE' && (
          <DisputeScreen
            dealId={selectedDealId || ''}
            onBack={() => setCurrentScreen('HOME')}
          />
        )}
      </main>
    </div>
  );
};

export default App;

