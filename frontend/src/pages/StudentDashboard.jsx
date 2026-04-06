import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Compass, Layers, Sparkles, Target, TrendingUp } from 'lucide-react';

import { getSkillGapForTargetRole } from '../api/analysisApi';
import { getAnalysisPreferences, getProfile } from '../api/profileApi';

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

const StatCard = ({ icon, label, value, suffix = '', sub, tone, delay = 0 }) => {
  const count = useCounter(value, 1000);
  return (
    <motion.div
      className="stat-card glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{ borderTop: `3px solid ${tone}` }}
    >
      <div className="stat-icon-wrap" style={{ background: `${tone}20`, color: tone }}>
        {icon}
      </div>
      <div className="stat-value">
        {count}
        {suffix}
      </div>
      <div className="stat-title">{label}</div>
      <div className="stat-label" style={{ marginTop: 4 }}>
        {sub}
      </div>
    </motion.div>
  );
};

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [gapSummary, setGapSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [profileData, prefsData] = await Promise.all([getProfile(), getAnalysisPreferences()]);
        setProfile(profileData);
        setPreferences(prefsData);

        const gapData = await getSkillGapForTargetRole();
        setGapSummary(gapData);
      } catch {
        setGapSummary(null);
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

  const weakSkills = gapSummary?.weak_skills || [];
  const readiness = gapSummary?.readiness_score || 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 420 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p className="page-subtitle">Preparing your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}
      >
        <div>
          <span className="badge badge-primary">Personalized Path</span>
          <h1 className="page-title">Welcome, {profile?.full_name?.split(' ')[0] || 'Learner'}</h1>
          <p className="page-subtitle">Your readiness plan adapts to your selected domain and career role.</p>
        </div>
        <div className="dashboard-meta-block">
          <p><strong>Domain:</strong> {preferences?.target_domain || gapSummary?.domain || 'Not Selected'}</p>
          <p><strong>Role:</strong> {preferences?.target_role || gapSummary?.role || 'Not Selected'}</p>
        </div>
      </motion.div>

      <div className="grid-auto">
        <StatCard icon={<Layers size={20} />} label="Total Skills" value={skills.length} sub="Captured in your profile" tone="#0f766e" />
        <StatCard icon={<TrendingUp size={20} />} label="Readiness" value={Math.round(readiness)} suffix="%" sub="Matched against selected role" tone="#0ea5e9" delay={0.08} />
        <StatCard icon={<AlertCircle size={20} />} label="Missing Skills" value={gapSummary?.missing_skills?.length || 0} sub="Skills to close for better fit" tone="#ea580c" delay={0.16} />
        <StatCard icon={<Target size={20} />} label="Weak Skills" value={weakSkills.length} sub="Need practice and strengthening" tone="#be123c" delay={0.24} />
      </div>

      <div className="grid-2">
        <motion.section className="glass card" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}>
          <h3 className="card-title"><Compass size={18} style={{ color: 'var(--primary)' }} /> Next Best Actions</h3>
          {(gapSummary?.recommendations || []).length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {gapSummary.recommendations.map((item, index) => (
                <div key={item} className="action-item">
                  <span className="action-index">{index + 1}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="page-subtitle">Complete your profile and role preferences to see action recommendations.</p>
          )}
        </motion.section>

        <motion.section className="glass card" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}>
          <h3 className="card-title"><Sparkles size={18} style={{ color: 'var(--primary)' }} /> Skill Overview</h3>
          {skills.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {skills.map((skill) => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </div>
          ) : (
            <p className="page-subtitle">No skills added yet. Go to profile and add your core strengths.</p>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default StudentDashboard;

