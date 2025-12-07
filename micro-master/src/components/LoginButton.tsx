// src/components/LoginButton.tsx
import React from 'react';

export interface LoginButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
}

const LoginButton: React.FC<LoginButtonProps> = ({
  disabled,
  onClick,
  isLoading,
  children,
}) => (
  <button
    type="submit"
    disabled={disabled || isLoading}
    onClick={onClick}
    className={`bg-[#0067B8] text-white py-2 px-4 rounded-sm shadow hover:bg-[#005a9e] transition ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    {isLoading ? 'Signing in...' : children}
  </button>
);

export default LoginButton;
