import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Cmd/Ctrl + K for quick navigation
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        // Could implement a command palette here
        return;
      }

      // Navigation shortcuts
      if (event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            router.push('/game');
            break;
          case '2':
            event.preventDefault();
            router.push('/agreements');
            break;
          case '3':
            event.preventDefault();
            router.push('/profile');
            break;
          case 'n':
            event.preventDefault();
            // Navigate to create agreement - could be implemented
            break;
        }
      }

      // Escape key to close modals (handled by individual components)
      if (event.key === 'Escape') {
        // This is handled by individual modal components
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
