'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface TelegramUserInfoProps {
  telegramId?: string;
  username?: string;
  onUpdate?: (username: string) => void;
}

export function TelegramUserInfo({ telegramId, username, onUpdate }: TelegramUserInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(username || '');
  
  // Use telegramId as username if username is not provided but telegramId is numeric
  const displayUsername = username || (telegramId && /^\d+$/.test(telegramId) ? telegramId : '');
  
  // Determine if we have a numeric ID (direct ID) or a username
  const isNumericId = telegramId && /^\d+$/.test(telegramId);
  const hasUsername = !!displayUsername && displayUsername !== telegramId;
  
  useEffect(() => {
    setInputValue(username || '');
  }, [username]);
  
  const handleSave = () => {
    if (onUpdate && inputValue !== username) {
      onUpdate(inputValue);
    }
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setInputValue(username || '');
    setIsEditing(false);
  };
  
  // Generate a color based on the telegramId or username for the avatar
  const generateColor = (id: string) => {
    const colors = [
      '#0088cc', // Telegram blue
      '#179cde',
      '#27a7ee',
      '#3db6ff',
      '#4fc3f7',
      '#64d2ff',
    ];
    
    // Simple hash function to get a consistent color
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  // Get initials for the avatar
  const getInitials = (name: string) => {
    if (!name) return '?';
    if (name.length <= 2) return name.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  
  const avatarColor = telegramId ? generateColor(telegramId) : '#0088cc';
  const initials = displayUsername ? getInitials(displayUsername) : '?';
  
  // Create a Telegram chat link
  const telegramLink = isNumericId 
    ? `tg://user?id=${telegramId}` 
    : displayUsername 
      ? `https://t.me/${displayUsername}` 
      : null;
  
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
        
        {/* User info */}
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Telegram username or ID"
              />
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
          ) : (
            <div>
              <div className="font-medium">
                {displayUsername ? `@${displayUsername}` : 'No Telegram username'}
              </div>
              {telegramId && (
                <div className="text-xs text-muted-foreground">
                  ID: {telegramId}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2">
          {!isEditing && onUpdate && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
          
          {telegramLink && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(telegramLink, '_blank')}
              className="text-[#0088cc] border-[#0088cc] hover:bg-[#0088cc] hover:text-white"
            >
              <ExternalLink size={16} className="mr-1" />
              Open
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
