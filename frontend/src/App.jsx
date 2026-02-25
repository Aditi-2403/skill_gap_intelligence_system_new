import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, User, BarChart3, Upload, LogOut, ShieldCheck, Search } from 'lucide-react';
import Auth from './pages/Auth';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import SkillGap from './pages/SkillGap';

// API Configuration
const API_BASE_URL = '';
axios.defaults.baseURL = API_BASE_URL;

const App = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/users/me');
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      logout();
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <Router>
      <div className="app-container">
        {user && <Sidebar user={user} logout={logout} />}
        <main className={user ? 'main-content' : 'w-full'}>
          <Routes>
            <Route path="/login" element={!user ? <Auth setToken={setToken} setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/" element={user ? (user.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />) : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/gap-analysis" element={user ? <SkillGap /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const Sidebar = ({ user, logout }) => {
  const location = useLocation();
  const isAdmin = user.role === 'admin';

  return (
    <div className="sidebar glass">
      <div className="flex items-center gap-3 mb-10 px-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <h1 className="font-bold text-xl tracking-tight">SkillSync</h1>
      </div>

      <nav className="flex-1">
        <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={location.pathname === '/'} />
        {isAdmin ? (
          <NavLink to="/admin" icon={<BarChart3 size={20} />} label="Batch Overview" active={location.pathname === '/admin'} />
        ) : (
          <>
            <NavLink to="/profile" icon={<User size={20} />} label="My Profile" active={location.pathname === '/profile'} />
            <NavLink to="/gap-analysis" icon={<BarChart3 size={20} />} label="Gap Analysis" active={location.pathname === '/gap-analysis'} />
          </>
        )}
      </nav>

      <div className="mt-auto px-4">
        <div className="p-4 rounded-xl bg-slate-800/40 mb-4">
          <p className="text-xs text-slate-500 mb-1">Logged in as</p>
          <p className="font-semibold text-sm truncate">{user.email}</p>
        </div>
        <button onClick={logout} className="nav-link w-full border-none cursor-pointer text-red-400 hover:text-red-300">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

const NavLink = ({ to, icon, label, active }) => (
  <Link to={to} className={`nav-link ${active ? 'active' : ''}`}>
    {icon}
    <span>{label}</span>
  </Link>
);

export default App;
