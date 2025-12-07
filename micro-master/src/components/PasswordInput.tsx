// ...existing code...
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id?: string;
  name?: string; // <-- add this
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ id, name, value, onChange, error, className }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`w-full ${className || ''}`}>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id || 'password'}
          name={name} // <-- forward name prop
          value={value}
          onChange={onChange}
          className={`w-full px-3 py-2 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 pr-10`}
          placeholder="Password"
          aria-label="Password input"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default PasswordInput;
// ...existing code...
