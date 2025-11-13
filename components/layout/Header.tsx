'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAppStore } from '@/lib/store';
import { signInWithWallet, signOut } from '@/lib/auth';
import { ThemeToggle } from './ThemeToggle';
import { MainNav } from './MainNav';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { session, user, setSession, clearSession, currentFounder } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Ensure we're mounted (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountMenu]);

  // Handle wallet connection/disconnection
  useEffect(() => {
    // Don't run during SSR or build
    if (!mounted) return;

    const handleWalletConnection = async () => {
      if (isConnected && address) {
        // Check if we need to create or update the session
        let needsNewSession = false;
        
        if (!session) {
          // No session exists
          needsNewSession = true;
        } else {
          // Session exists, verify it matches the current wallet
          if (!user || user.ethereumAddress?.toLowerCase() !== address.toLowerCase()) {
            // Session doesn't match current wallet, clear it and create new one
            await signOut();
            clearSession();
            needsNewSession = true;
          }
        }
        
        if (needsNewSession) {
          try {
            const result = await signInWithWallet(address);
            
            if (result.success && result.user && result.session) {
              await setSession(result.session, result.user);
              
              // Only redirect if we're on the homepage - don't redirect from other pages
              if (pathname === '/') {
                setTimeout(() => {
                  const { currentFounder } = useAppStore.getState();
                  if (currentFounder) {
                    router.push('/game');
                  } else {
                    router.push('/create-founder');
                  }
                }, 200);
              }
            }
          } catch (error) {
            console.error('Failed to authenticate with wallet:', error);
          }
        }
      } else if (!isConnected && session) {
        // Wallet disconnected, clear session
        await signOut();
        clearSession();
        // Only redirect to home if we're not already there
        if (pathname !== '/') {
          router.push('/');
        }
      }
    };
    
    handleWalletConnection();
  }, [mounted, isConnected, address, session, user, setSession, clearSession, router, pathname]);

  const handleDisconnect = async () => {
    // Clear app session first
    await signOut();
    clearSession();
    
    // Disconnect wallet
    disconnect();
    
    // Clear all wallet connection state
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wagmi.store');
      localStorage.removeItem('wagmi.cache');
      localStorage.removeItem('wagmi.wallet');
      localStorage.removeItem('wagmi.connected');
      localStorage.removeItem('rainbowkit.recent');
      localStorage.removeItem('rainbowkit.wallet');
      
      // Clear all localStorage keys that start with 'wagmi' or 'rainbowkit'
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('wagmi') || key.startsWith('rainbowkit')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // Redirect to home
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-700 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link 
          href="/" 
          className="flex items-center space-x-2"
        >
          <div className="h-8 w-8 rounded-full bg-primary" />
          <span className="font-space-grotesk font-bold text-xl text-gray-900 dark:text-gray-100">
            Polycentric
          </span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <MainNav />
          <div className="flex items-center space-x-2">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="bg-primary text-black px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 12,
                                  height: 12,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                  marginRight: 4,
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 12, height: 12 }}
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </button>

                          <div className="relative" ref={accountMenuRef}>
                            <button
                              onClick={() => setShowAccountMenu(!showAccountMenu)}
                              type="button"
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              {account.displayName}
                              {currentFounder 
                                ? ` (${currentFounder.founderName.split(' ')[0]})` 
                                : account.displayBalance
                                  ? ` (${account.displayBalance})`
                                  : ''}
                              <svg
                                className={`w-4 h-4 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            
                            {showAccountMenu && (
                              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      openAccountModal();
                                      setShowAccountMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    Account Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      openChainModal();
                                      setShowAccountMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    Switch Network
                                  </button>
                                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                                  <button
                                    onClick={async () => {
                                      await handleDisconnect();
                                      setShowAccountMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    Sign Out
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
