'use client';

import React from 'react';
import Image from 'next/image';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '@/hooks/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, isLoading } = useAuth();

  const handleLogin = () => {
    // Privy handles the login UI — shows its own modal with wallet/social options
    login();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/sbs-logo.png"
            alt="SBS Fantasy"
            width={64}
            height={64}
          />
        </div>

        <h2 className="text-2xl font-bold text-text-primary mb-2">Log in or sign up</h2>
        <p className="text-text-secondary mb-8">Connect your wallet or sign in with a social account to get started</p>

        {/* Single login button — Privy handles method selection */}
        <div className="space-y-3">
          <Button
            onClick={handleLogin}
            isLoading={isLoading}
            className="w-full"
            size="lg"
          >
            Sign In
          </Button>
        </div>

        <p className="text-text-muted text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </Modal>
  );
}
