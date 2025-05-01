'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, User, X } from 'lucide-react';

interface UsernameSuggestionsModalProps {
  suggestions: string[];
  onSelect: (username: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function UsernameSuggestionsModal({
  suggestions,
  onSelect,
  onClose,
  isLoading = false,
}: UsernameSuggestionsModalProps) {
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Add a subtle floating animation to the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let animationId: number;
    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const y = Math.sin(elapsed / 1000) * 3; // Subtle 3px floating effect
      
      container.style.transform = `translateY(${y}px)`;
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handleSelect = (username: string) => {
    setSelectedUsername(username);
    
    // Add a small delay before calling onSelect for better visual feedback
    setTimeout(() => {
      onSelect(username);
    }, 300);
  };

  // Handle escape key to close the modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md p-6 bg-white/95 dark:bg-gray-900/95 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl"
        style={{ 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <X size={18} className="text-gray-500" />
        </button>
        
        {isLoading ? (
          <>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles size={18} className="text-blue-500 animate-pulse" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Finding available usernames</h3>
            </div>
            
            <div className="flex justify-center py-6">
              <div className="flex space-x-3 items-center">
                <div className="h-2.5 w-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2.5 w-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2.5 w-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
            
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              Creating personalized username suggestions based on your profile
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles size={18} className="text-blue-500" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Suggested usernames</h3>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This username is already taken. Here are some available alternatives:
            </p>
            
            <div className="grid gap-2 mb-4 max-h-[40vh] overflow-y-auto pr-1">
              {suggestions.map((username, index) => (
                <motion.button
                  key={username}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => handleSelect(username)}
                  className={`group relative flex items-center justify-between w-full p-3.5 rounded-lg text-left transition-all ${
                    selectedUsername === username
                      ? 'bg-blue-50 border border-blue-300 text-blue-700 shadow-sm'
                      : 'bg-white/80 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="flex items-center">
                    <User size={16} className={`mr-2 ${selectedUsername === username ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-500'}`} />
                    <span className={`text-base ${selectedUsername === username ? 'font-medium' : ''}`}>{username}</span>
                  </div>
                  
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: selectedUsername === username ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white"
                  >
                    <Check size={14} />
                  </motion.div>
                  
                  {selectedUsername !== username && (
                    <span className="absolute right-3 opacity-0 group-hover:opacity-100 text-xs text-blue-500 transition-opacity">
                      Select
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click on a username to use it for your account
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
