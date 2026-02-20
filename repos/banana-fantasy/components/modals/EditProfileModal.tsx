'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { getNflTeamLogo } from '@/lib/nflTeams';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const nflTeams = [
  'Cardinals', 'Falcons', 'Ravens', 'Bills', 'Panthers', 'Bears', 'Bengals', 'Browns',
  'Cowboys', 'Broncos', 'Lions', 'Packers', 'Texans', 'Colts', 'Jaguars', 'Chiefs',
  'Raiders', 'Chargers', 'Rams', 'Dolphins', 'Vikings', 'Patriots', 'Saints', 'Giants',
  'Jets', 'Eagles', 'Steelers', '49ers', 'Seahawks', 'Buccaneers', 'Titans', 'Commanders'
];

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState('');
  const [nflTeam, setNflTeam] = useState('');
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setNflTeam(user.nflTeam || '');
      setProfilePicturePreview(user.profilePicture || null);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateUser({
      username,
      nflTeam: nflTeam || undefined,
      profilePicture: profilePicturePreview || undefined,
    });
    onClose();
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="md">
      <div className="space-y-6">
        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Profile Picture
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-[#1a1a2e] border border-white/20">
              {profilePicturePreview ? (
                <Image
                  src={profilePicturePreview}
                  alt={user.username}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-4xl">🍌</span>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Change Picture
            </Button>
          </div>
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full input"
            placeholder="Enter username"
          />
        </div>

        {/* NFL Team */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Favorite NFL Team
            {nflTeam && <span className="text-text-muted ml-2">({nflTeam})</span>}
          </label>
          <div className="grid grid-cols-8 gap-2 p-3 bg-bg-tertiary rounded-lg max-h-48 overflow-y-auto">
            {nflTeams.map((team) => (
              <button
                key={team}
                type="button"
                onClick={() => setNflTeam(team)}
                className={`p-1.5 rounded-lg transition-all hover:bg-bg-secondary ${
                  nflTeam === team
                    ? 'bg-banana/20 ring-2 ring-banana'
                    : 'hover:scale-110'
                }`}
                title={team}
              >
                <Image
                  src={getNflTeamLogo(team)!}
                  alt={team}
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                />
              </button>
            ))}
          </div>
        </div>

        {/* X (Twitter) Connection */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            X (Twitter)
          </label>
          {user.xHandle ? (
            <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-text-primary">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-text-primary font-medium">{user.xHandle}</span>
              </div>
              <span className="text-xs text-success font-medium">Connected</span>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => alert('X OAuth would open here')}
              className="w-full flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Connect X Account
            </Button>
          )}
        </div>

        <div className="p-4 bg-bg-tertiary rounded-lg border border-white/10">
          <p className="text-sm font-medium text-text-primary">Wallet Address</p>
          <p className="text-xs text-text-muted mt-1">
            Use this address for prize withdrawals.
          </p>
          <div className="mt-3 p-2 bg-bg-primary rounded border border-white/10">
            <code className="text-xs text-text-primary break-all select-all">
              {user.walletAddress}
            </code>
          </div>
        </div>


        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
