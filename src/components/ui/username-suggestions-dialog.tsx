'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UsernameSuggestionsDialogProps {
  suggestions: string[];
  onSelect: (username: string) => void;
  onClose: () => void;
  isLoading?: boolean;
  open: boolean;
}

export function UsernameSuggestionsDialog({
  suggestions,
  onSelect,
  onClose,
  isLoading = false,
  open,
}: UsernameSuggestionsDialogProps) {
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  const handleSelect = (username: string) => {
    setSelectedUsername(username);

    // Call onSelect immediately to update the form value
    onSelect(username);

    // Add a small delay before closing the dialog for better visual feedback
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suggested usernames</DialogTitle>
          <DialogDescription>
            This username is already taken. Here are some available alternatives:
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex space-x-2 mb-4">
              <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-sm text-gray-500">
              Loading username suggestions...
            </p>
          </div>
        ) : (
          <div className="grid gap-2 py-4 max-h-[40vh] overflow-y-auto">
            {suggestions.map((username, index) => (
              <motion.button
                key={username}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onClick={() => handleSelect(username)}
                className={`group relative flex items-center justify-between w-full p-3 rounded-md text-left transition-all ${selectedUsername === username
                    ? 'bg-blue-50 border border-blue-300 text-blue-700'
                    : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
              >
                <div className="flex items-center">
                  <User size={16} className={`mr-2 ${selectedUsername === username ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className={`${selectedUsername === username ? 'font-medium' : ''}`}>{username}</span>
                </div>

                {selectedUsername === username && (
                  <Check size={16} className="text-blue-500" />
                )}
              </motion.button>
            ))}
          </div>
        )}

        <div className="text-center text-xs text-gray-500 mt-2">
          Click on a username to use it for your account
        </div>
      </DialogContent>
    </Dialog>
  );
}
