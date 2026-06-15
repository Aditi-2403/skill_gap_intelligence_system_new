import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserCog,
} from 'lucide-react';

import {
  forgotPassword,
  getCurrentUser,
  loginUser,
  registerUser,
  resendVerification,
  resetPassword,
  verifyEmail,
} from '../api/authApi';

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

const modeCopy = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to your SkillSync dashboard',
    submit: 'Sign In',
    loading: 'Signing in...',
  },
  register: {
    title: 'Create account',
    subtitle: 'Create your account to start skill gap analysis',
    submit: 'Create Account',
    loading: 'Creating account...',
  },
  verify: {
    title: 'Verify email',
    subtitle: 'Enter the verification code sent to your email',
    submit: 'Verify Email',
    loading: 'Verifying...',
  },
  resend: {
    title: 'Resend verification',
    subtitle: 'Send a fresh verification code to your email',
    submit: 'Resend Email',
    loading: 'Sending...',
  },
  forgot: {
    title: 'Forgot password',
    subtitle: 'Request a password reset code for your account',
    submit: 'Send Reset Code',
    loading: 'Sending...',
  },
  reset: {
    title: 'Reset password',
    subtitle: 'Enter your reset code and choose a new password',
    submit: 'Reset Password',
    loading: 'Resetting...',
  },
};

const Auth = ({ setToken, setUser, initialMode = 'login' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loginRole, setLoginRole] = useState('learner');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const activeMode = modeCopy[mode] ? mode : 'login';
  const copy = modeCopy[activeMode];
  const isLogin = activeMode === 'login';
  const isRegister = activeMode === 'register';
  const needsPassword = ['login', 'register', 'reset'].includes(activeMode);
  const needsConfirmPassword = ['register', 'reset'].includes(activeMode);
  const needsOtp = ['verify', 'reset'].includes(activeMode);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setMessage('');
  }, [initialMode]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailFromUrl = params.get('email');
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [location.search]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setMessage('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
  };

  const requireMatchingPasswords = () => {
    if (password !== confirmPassword) {
      throw new Error('Password and confirm password do not match.');
    }
  };

  const handleLogin = async () => {
    const result = await loginUser({ email, password });
    localStorage.setItem('token', result.access_token);
    const currentUser = result.user || (await getCurrentUser());

    if (loginRole === 'admin' && currentUser?.role !== 'admin') {
      localStorage.removeItem('token');
      throw new Error('This account is not an administrator account.');
    }
    if (loginRole === 'learner' && currentUser?.role === 'admin') {
      localStorage.removeItem('token');
      throw new Error('Please choose Administrator login for this account.');
    }

    localStorage.setItem('user', JSON.stringify(currentUser));
    setUser(currentUser);
    setToken(result.access_token);
    navigate(result.redirect_to || (currentUser?.role === 'admin' ? '/batch-overview' : '/'), { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (activeMode === 'login') {
        await handleLogin();
      }

      if (activeMode === 'register') {
        requireMatchingPasswords();
        const result = await registerUser({
          full_name: fullName,
          email,
          password,
          confirm_password: confirmPassword,
        });
        switchMode('verify');
        setMessage(result?.message || 'Verification email sent. Please verify your account.');
      }

      if (activeMode === 'verify') {
        const result = await verifyEmail({ email, otp });
        switchMode('login');
        setMessage(result?.message || 'Email verified successfully. You can now log in.');
      }

      if (activeMode === 'resend') {
        const result = await resendVerification({ email });
        switchMode('verify');
        setMessage(result?.message || 'Verification email sent. Please verify your account.');
      }

      if (activeMode === 'forgot') {
        const result = await forgotPassword({ email });
        switchMode('reset');
        setMessage(result?.message || 'If an account exists, password reset instructions have been sent.');
      }

      if (activeMode === 'reset') {
        requireMatchingPasswords();
        const result = await resetPassword({
          email,
          otp,
          password,
          confirm_password: confirmPassword,
        });
        switchMode('login');
        setMessage(result?.message || 'Password reset successfully. You can now log in.');
      }
    } catch (requestError) {
      const errorMessage = (
        requestError?.response?.data?.detail
          || requestError?.message
          || 'An error occurred. Please try again.'
      );
      if (errorMessage === 'Please verify your email before logging in.') {
        switchMode('verify');
        setMessage('Please enter the verification code sent to your email, or resend a new one.');
      } else {
        setError(errorMessage);
      }
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
            <button type="button" className={`auth-mode-btn ${isLogin ? 'active' : ''}`} onClick={() => switchMode('login')}>
              Sign In
            </button>
            <button type="button" className={`auth-mode-btn ${isRegister ? 'active' : ''}`} onClick={() => switchMode('register')}>
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeMode} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>
              <h2 className="auth-title">{copy.title}</h2>
              <p className="auth-subtitle">{copy.subtitle}</p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {message && (
              <motion.div className="alert alert-success" style={{ marginBottom: 20 }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <CheckCircle size={15} />
                {message}
              </motion.div>
            )}
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
                    <button type="button" className={`auth-role-btn ${loginRole === 'learner' ? 'active' : ''}`} onClick={() => setLoginRole('learner')}>
                      Learner Login
                    </button>
                    <button type="button" className={`auth-role-btn ${loginRole === 'admin' ? 'active' : ''}`} onClick={() => setLoginRole('admin')}>
                      Administrator Login
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isRegister && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-icon-wrap">
                  <User size={16} className="input-icon" />
                  <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} className="input-field" placeholder="Your full name" required minLength={2} maxLength={120} autoComplete="name" />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrap">
                <Mail size={16} className="input-icon" />
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input-field" placeholder="name@example.com" required autoComplete="email" />
              </div>
            </div>

            {needsOtp && (
              <div className="form-group">
                <label className="form-label">{activeMode === 'reset' ? 'Reset Code' : 'Verification Code'}</label>
                <div className="input-icon-wrap">
                  <KeyRound size={16} className="input-icon" />
                  <input type="text" value={otp} onChange={(event) => setOtp(event.target.value)} className="input-field" placeholder="Enter code" required inputMode="numeric" autoComplete="one-time-code" />
                </div>
              </div>
            )}

            {needsPassword && (
              <div className="form-group">
                <label className="form-label">{activeMode === 'reset' ? 'New Password' : 'Password'}</label>
                <div className="input-icon-wrap">
                  <Lock size={16} className="input-icon" />
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="input-field" placeholder={activeMode === 'reset' ? 'Enter new password' : 'Enter your password'} required minLength={8} autoComplete={isLogin ? 'current-password' : 'new-password'} />
                </div>
              </div>
            )}

            {needsConfirmPassword && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-icon-wrap">
                  <Lock size={16} className="input-icon" />
                  <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input-field" placeholder="Confirm your password" required minLength={8} autoComplete="new-password" />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8, width: '100%', opacity: loading ? 0.75 : 1 }}>
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  {copy.loading}
                </>
              ) : (
                <>
                  {copy.submit}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {isLogin && (
              <button type="button" className="auth-switch-btn" onClick={() => switchMode('forgot')}>
                Forgot password?
              </button>
            )}

            {activeMode === 'verify' && (
              <button type="button" className="auth-switch-btn" onClick={() => switchMode('resend')}>
                Resend verification email
              </button>
            )}

            {['forgot', 'reset', 'resend', 'verify'].includes(activeMode) && (
              <button type="button" className="auth-switch-btn" onClick={() => switchMode('login')}>
                Back to sign in
              </button>
            )}
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
