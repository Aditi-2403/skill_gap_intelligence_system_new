import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BarChart3, LayoutDashboard, LogOut, Menu, ShieldCheck, TrendingUp, User, X } from 'lucide-react';

import { getCurrentUser } from './api/authApi';

const Auth = lazy(() => import('./pages/Auth'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const SkillGap = lazy(() => import('./pages/SkillGap'));

const RouteLoader = () => (
  <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
    <div className="spinner" />
  </div>
);

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Intentional no-op: keep user-facing fallback stable.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass card" style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center' }}>
          <h2 className="page-title" style={{ fontSize: '1.45rem' }}>Something went wrong</h2>
          <p className="page-subtitle">Please refresh the page. If the issue continues, restart frontend and backend servers.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    if (!token) return;

    const syncUser = async () => {
      try {
        const current = await getCurrentUser();
        setUser(current);
        localStorage.setItem('user', JSON.stringify(current));
      } catch {
        logout();
      }
    };

    syncUser();
  }, [token]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <div className="network-banner" role="status" aria-live="polite">
        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
        {isOnline ? 'Connected' : 'Offline mode: check your internet or local server connection'}
      </div>
      <div className="app-container">
        <AppErrorBoundary>
          {user && (
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label="Toggle sidebar navigation"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          {user && (
            <Sidebar user={user} logout={logout} mobileOpen={sidebarOpen} closeMobile={() => setSidebarOpen(false)} />
          )}

          {user && sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}

          <main className={user ? 'main-content' : 'w-full'} style={!user ? { width: '100%' } : {}}>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route
                  path="/login"
                  element={!user ? <Auth setToken={setToken} setUser={setUser} /> : <Navigate to="/" />}
                />
                <Route
                  path="/"
                  element={
                    user
                      ? (user.role === 'admin' ? <Navigate to="/batch-overview" /> : <StudentDashboard />)
                      : <Navigate to="/login" />
                  }
                />
                <Route
                  path="/batch-overview"
                  element={user ? (user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />) : <Navigate to="/login" />}
                />
                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
                <Route path="/gap-analysis" element={user ? <SkillGap /> : <Navigate to="/login" />} />
              </Routes>
            </Suspense>
          </main>
        </AppErrorBoundary>
      </div>
    </Router>
  );
};

const Sidebar = ({ user, logout, mobileOpen, closeMobile }) => {
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const initials = useMemo(() => (user?.email || 'U')[0].toUpperCase(), [user?.email]);

  return (
    <aside className={`sidebar glass ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShieldCheck size={22} color="white" />
        </div>
        <h1>SkillSync</h1>
      </div>

      <nav style={{ flex: 1 }} aria-label="Primary navigation">
        <div className="sidebar-section-label">Main</div>
        {isAdmin ? (
          <NavLink
            to="/batch-overview"
            icon={<BarChart3 size={17} />}
            label="Batch Overview"
            active={location.pathname === '/batch-overview' || location.pathname === '/'}
            onClick={closeMobile}
          />
        ) : (
          <>
            <NavLink
              to="/"
              icon={<LayoutDashboard size={17} />}
              label="Dashboard"
              active={location.pathname === '/'}
              onClick={closeMobile}
            />
            <div className="sidebar-section-label" style={{ marginTop: 16 }}>
              Profile
            </div>
            <NavLink
              to="/profile"
              icon={<User size={17} />}
              label="My Profile"
              active={location.pathname === '/profile'}
              onClick={closeMobile}
            />
            <NavLink
              to="/gap-analysis"
              icon={<TrendingUp size={17} />}
              label="Gap Analysis"
              active={location.pathname === '/gap-analysis'}
              onClick={closeMobile}
            />
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="sidebar-email">{user?.email}</p>
            <p className="sidebar-role">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            closeMobile();
          }}
          className="nav-link"
          style={{ color: '#ef4444', width: '100%', border: '1px solid transparent' }}
          aria-label="Sign out"
        >
          <span className="nav-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <LogOut size={15} />
          </span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const NavLink = ({ to, icon, label, active, onClick }) => (
  <Link to={to} className={`nav-link ${active ? 'active' : ''}`} onClick={onClick} aria-current={active ? 'page' : undefined}>
    <span className="nav-icon">{icon}</span>
    <span>{label}</span>
    {active && <span className="nav-dot" />}
  </Link>
);

export default App;
