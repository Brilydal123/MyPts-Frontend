import { signOut } from 'next-auth/react';

export const clearStorages = () => {
  // Clear all browser storages
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.error('Error clearing storages:', e);
  }
};

export const handleLogout = async () => {
  try {
    // Clear all stored data first
    clearStorages();

    // Call NextAuth signOut with specific options
    await signOut({
      callbackUrl: '/login',
      redirect: true
    });

    // Force reload to clear any in-memory state
    window.location.reload();

  } catch (error) {
    console.error('Error during logout:', error);
    // Fallback: force reload to login page
    window.location.href = '/login';
  }
};
