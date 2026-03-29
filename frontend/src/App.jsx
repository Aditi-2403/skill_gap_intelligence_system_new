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

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const dashboard = user?.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />;

  return (
    <Router>
      <div className="app-container">
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
              <Route path="/" element={user ? dashboard : <Navigate to="/login" />} />
              <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/gap-analysis" element={user ? <SkillGap /> : <Navigate to="/login" />} />
            </Routes>
          </Suspense>
        </main>
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
        <NavLink
          to="/"
          icon={<LayoutDashboard size={17} />}
          label="Dashboard"
          active={location.pathname === '/'}
          onClick={closeMobile}
        />

        {isAdmin ? (
          <NavLink
            to="/"
            icon={<BarChart3 size={17} />}
            label="Batch Overview"
            active={false}
            onClick={closeMobile}
          />
        ) : (
          <>
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
