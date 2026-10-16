import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { ShieldCheck, Lock, Mail, User, Home, ArrowRight, Sparkles } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { isSetup, login, setupOwner } = useFamily();

  // Setup form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('Mom');
  const [familyName, setFamilyName] = useState('Our Family');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!isSetup) {
        await setupOwner(email, password, displayName, familyName);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101311] text-[#f6f7f6] flex flex-col justify-center items-center px-4 py-8">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#174d35]/25 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* App Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#174d35] to-[#123122] border border-[#43b879]/30 shadow-lg shadow-[#174d35]/30 mb-4">
            <ShieldCheck className="w-8 h-8 text-[#43b879]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Family Points
          </h1>
          <p className="text-sm text-[#a6aea9]">
            {isSetup
              ? 'Administrator Login for Mom'
              : 'Initial One-Time Administrator Setup'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#151a17] border border-[#24332a] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {!isSetup && (
            <div className="mb-6 bg-[#174d35]/20 border border-[#2e5e41] rounded-xl p-4 text-xs text-[#a6aea9] leading-relaxed">
              <div className="flex items-center gap-1.5 text-[#43b879] font-semibold text-sm mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Private Family Space</span>
              </div>
              You are configuring this application for your family. As the administrator, only you will have access to create tasks, award points, and manage family rewards.
            </div>
          )}

          {error && (
            <div className="mb-5 bg-[#291717] border border-[#6b2c2c] rounded-xl p-3 text-sm text-[#fca5a5] flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444] mt-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSetup && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                    Your Name / Role
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#a6aea9] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Mom"
                      className="w-full bg-[#101311] border border-[#24332a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                    Family Name
                  </label>
                  <div className="relative">
                    <Home className="w-4 h-4 text-[#a6aea9] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={familyName}
                      onChange={e => setFamilyName(e.target.value)}
                      placeholder="e.g. The Miller Family"
                      className="w-full bg-[#101311] border border-[#24332a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879] transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#a6aea9] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="mom@example.com"
                  className="w-full bg-[#101311] border border-[#24332a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a6aea9] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#a6aea9] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#101311] border border-[#24332a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#43b879] transition-colors"
                />
              </div>
              {!isSetup && (
                <p className="text-[11px] text-[#a6aea9] mt-1">Minimum 6 characters. Remember this password to sign in.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-[#174d35] hover:bg-[#1e6143] active:scale-[0.99] text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-[#174d35]/25 border border-[#43b879]/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{isSubmitting ? 'Verifying...' : isSetup ? 'Log In to Family Points' : 'Complete Setup & Enter'}</span>
              <ArrowRight className="w-4 h-4 text-[#43b879]" />
            </button>
          </form>

          {isSetup && (
            <p className="text-center text-xs text-[#a6aea9] mt-6">
              This application is private to your family. Public registration is closed.
            </p>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-8 text-xs text-[#a6aea9]/60">
          Family Points &bull; Mobile-First Family Task & Reward Ledger
        </div>
      </div>
    </div>
  );
};
