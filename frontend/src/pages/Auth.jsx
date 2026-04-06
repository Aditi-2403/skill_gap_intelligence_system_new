import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Lock, Mail, ShieldCheck, Sparkles, UserCog } from 'lucide-react';

import { getCurrentUser, loginUser, registerUser } from '../api/authApi';

const Orb = ({ style }) => (
  <div
    style={{
      position: 'absolute',
      borderRadius: '50%',
      filter: 'blur(60px)',
      opacity: 0.2,
      pointerEvents: 'none',
      animation: 'float 6s ease-in-out infinite',
      ...style,
    }}
  />
);

const Auth = ({ setToken, setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await loginUser({ email, password });
        localStorage.setItem('token', result.access_token);
        const currentUser = await getCurrentUser();

        if (loginRole === 'admin' && currentUser?.role !== 'admin') {
          localStorage.removeItem('token');
          throw new Error('This account is not an administrator account.');
        }
        if (loginRole === 'student' && currentUser?.role === 'admin') {
          localStorage.removeItem('token');
          throw new Error('Please choose Administrator login for this account.');
        }

        localStorage.setItem('user', JSON.stringify(currentUser));
        setUser(currentUser);
        setToken(result.access_token);
      } else {
        await registerUser({ email, password, role: 'student' });
        setIsLogin(true);
        setLoginRole('student');
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail
          || requestError?.message
          || 'An error occurred. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <motion.div className="auth-card glass" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div className="sidebar-logo-icon" style={{ width: 36, height: 36, borderRadius: 10 }}>
              <ShieldCheck size={18} color="white" />
            </div>
            <span className="brand-title">SkillSync</span>
          </div>

          <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={`auth-mode-btn ${isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-mode-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
            >
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={isLogin ? 'login' : 'register'} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>
              <h2 className="auth-title">{isLogin ? 'Welcome back' : 'Create account'}</h2>
              <p className="auth-subtitle">
                {isLogin ? 'Sign in to your SkillSync dashboard' : 'Create your account to start skill gap analysis'}
              </p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div className="alert alert-danger" style={{ marginBottom: 20 }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <AlertCircle size={15} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AnimatePresence>
              {isLogin && (
                <motion.div className="form-group" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                  <label className="form-label">
                    <UserCog size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Login As
                  </label>
                  <div className="auth-role-grid">
                    <button
                      type="button"
                      className={`auth-role-btn ${loginRole === 'student' ? 'active' : ''}`}
                      onClick={() => setLoginRole('student')}
                    >
                      Student Login
                    </button>
                    <button
                      type="button"
                      className={`auth-role-btn ${loginRole === 'admin' ? 'active' : ''}`}
                      onClick={() => setLoginRole('admin')}
                    >
                      Administrator Login
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="input-field"
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8, width: '100%', opacity: loading ? 0.75 : 1 }}>
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      <div className="auth-right">
        <Orb style={{ width: 360, height: 360, background: '#0ea5e9', top: '10%', left: '20%' }} />
        <Orb style={{ width: 260, height: 260, background: '#22c55e', bottom: '15%', right: '15%', animationDelay: '2s' }} />
        <Orb style={{ width: 200, height: 200, background: '#f59e0b', top: '55%', left: '5%', animationDelay: '4s' }} />

        <div className="auth-promo">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
            <div className="promo-icon-wrap">
              <Sparkles size={32} color="white" />
            </div>
            <h2 className="promo-title">Identify Your Skill Gaps</h2>
            <p className="promo-copy">
              SkillSync compares your profile with real industry role requirements and helps you prioritize your next learning steps.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 28 }}>
              {['Gap Analysis', 'Resume Parsing', 'Role Benchmarks', 'Progress Tracking'].map((feature) => (
                <span key={feature} className="badge badge-primary" style={{ fontSize: '0.76rem' }}>
                  {feature}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
