import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Briefcase, CheckCircle2, GraduationCap, TrendingUp, Zap } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { getIndustryRoles, getSkillGap } from '../api/analysisApi';
import { getProfile } from '../api/profileApi';

const useCounter = (target, duration = 1200) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const normalizedTarget = Number(target) || 0;
    if (normalizedTarget <= 0) {
      setValue(0);
      return;
    }

    const step = Math.ceil(normalizedTarget / (duration / 16));
    let current = 0;
    const timer = window.setInterval(() => {
      current = Math.min(current + step, normalizedTarget);
      setValue(current);
      if (current >= normalizedTarget) {
        window.clearInterval(timer);
      }
    }, 16);

    return () => window.clearInterval(timer);
  }, [target, duration]);

  return value;
};

const StatCard = ({ icon, label, value, sub, color, suffix = '', delay = 0 }) => {
  const count = useCounter(value, 1000);

  return (
    <motion.div className="stat-card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }} style={{ borderLeft: `3px solid ${color}` }}>
      <div className="stat-icon-wrap" style={{ background: `${color}18`, color }}>{icon}</div>
      <div className="stat-value">{count}{suffix}</div>
      <div className="stat-title">{label}</div>
      <div className="stat-label" style={{ marginTop: 4 }}>{sub}</div>
    </motion.div>
  );
};

const DashboardTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="glass" style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
      <p style={{ fontWeight: 600 }}>{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{payload[0].value} items</p>
    </div>
  );
};

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gapSummary, setGapSummary] = useState({ readiness: 0, gaps: 0 });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const profileData = await getProfile();
        setProfile(profileData);

        const roles = await getIndustryRoles();
        if (roles?.length) {
          const firstRole = roles[0]?.role;
          const gap = await getSkillGap(firstRole);
          setGapSummary({ readiness: gap.match_score || 0, gaps: gap.missing_skills?.length || 0 });
        }
      } catch {
        // Keep graceful fallback for users without profile.
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const skills = useMemo(() => {
    if (!profile?.skills) return [];
    return profile.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  }, [profile?.skills]);

  const pieData = [
    { name: 'Skills', value: Math.max(skills.length, 1), fill: '#0ea5e9' },
    { name: 'Certifications', value: profile?.certifications ? 1 : 0, fill: '#16a34a' },
    { name: 'Projects', value: profile?.projects ? 1 : 0, fill: '#f59e0b' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p className="page-subtitle">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div className="live-indicator-icon">
            <Zap size={16} color="white" />
          </div>
          <span className="badge badge-success">Live Dashboard</span>
        </div>
        <h1 className="page-title">Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}</h1>
        <p className="page-subtitle">Here is your current skill inventory and readiness progress.</p>
      </motion.div>

      <div className="grid-auto">
        <StatCard icon={<CheckCircle2 size={22} />} label="Known Skills" value={skills.length} sub="Skills in your current profile" color="#0ea5e9" delay={0} />
        <StatCard icon={<TrendingUp size={22} />} label="Readiness Score" value={gapSummary.readiness} suffix="%" sub="Based on latest role analysis" color="#16a34a" delay={0.08} />
        <StatCard icon={<AlertCircle size={22} />} label="Gaps Identified" value={gapSummary.gaps} sub="Missing skills in analyzed role" color="#f59e0b" delay={0.16} />
      </div>

      <div className="grid-2">
        <motion.div className="glass card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
          <h3 className="card-title">
            <Briefcase size={18} style={{ color: 'var(--primary)' }} />
            Profile Distribution
          </h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={58} outerRadius={82} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<DashboardTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="glass card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
          <h3 className="card-title" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <GraduationCap size={18} style={{ color: 'var(--primary)' }} />
              My Skills
            </span>
            <span className="badge badge-primary">{skills.length} total</span>
          </h3>

          {skills.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {skills.map((skill, index) => (
                <motion.span key={skill} className="skill-tag" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 + index * 0.04 }}>
                  {skill}
                </motion.span>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <GraduationCap size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.875rem' }}>No skills added yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Go to My Profile to add your academic and skill details.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;
