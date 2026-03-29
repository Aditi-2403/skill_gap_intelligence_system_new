import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BookOpen, CheckCircle, ChevronRight, Target, TrendingUp, Zap } from 'lucide-react';

import { getIndustryRoles, getSkillGap } from '../api/analysisApi';

const ScoreRing = ({ score = 0 }) => {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;
  const color = score >= 75 ? '#16a34a' : score >= 45 ? '#0ea5e9' : '#f59e0b';

  return (
    <div style={{ position: 'relative', width: 136, height: 136, flexShrink: 0 }}>
      <svg width="136" height="136" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="68" cy="68" r={radius} stroke="rgba(17, 24, 39, 0.1)" strokeWidth="10" fill="none" />
        <circle
          cx="68"
          cy="68"
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="score-ring"
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="ring-score">{score}%</span>
      </div>
    </div>
  );
};

const SkillGap = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [gapData, setGapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const result = await getIndustryRoles();
        setRoles(result || []);
      } catch {
        setError('Unable to fetch roles right now.');
      } finally {
        setRolesLoading(false);
      }
    };

    loadRoles();
  }, []);

  const handleRoleSelect = async (roleName) => {
    setSelectedRole(roleName);
    setGapData(null);
    setError('');
    setLoading(true);

    try {
      const result = await getSkillGap(roleName);
      setGapData(result);
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || 'Unable to run analysis. Complete your profile and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Industry Skill Gap Engine</h1>
        <p className="page-subtitle">Select a target role to view readiness score and missing competencies.</p>
      </motion.div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="gap-layout">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <p className="sidebar-section-label" style={{ marginBottom: 10, marginTop: 0 }}>
            Target Roles
          </p>

          {rolesLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton" style={{ height: 46, marginBottom: 6, borderRadius: 12 }} />
              ))
            : roles.map((role) => {
                const isActive = selectedRole === role.role;
                return (
                  <motion.button
                    key={role.role}
                    onClick={() => handleRoleSelect(role.role)}
                    className="nav-link"
                    style={{
                      width: '100%',
                      marginBottom: 4,
                      justifyContent: 'space-between',
                      background: isActive ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(6, 182, 212, 0.12))' : undefined,
                      borderColor: isActive ? 'rgba(14, 165, 233, 0.35)' : 'transparent',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 500 }}>{role.role}</span>
                    <ChevronRight size={14} style={{ color: isActive ? 'var(--primary)' : 'var(--text-subtle)' }} />
                  </motion.button>
                );
              })}
        </motion.div>

        <div>
          <AnimatePresence mode="wait">
            {!selectedRole && (
              <motion.div key="placeholder" className="glass card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '60px 40px', textAlign: 'center' }}>
                <Target size={56} style={{ color: 'rgba(14, 165, 233, 0.3)', margin: '0 auto 12px' }} />
                <h2 className="panel-title">Select a career path</h2>
                <p className="page-subtitle" style={{ maxWidth: 360, margin: '10px auto 0' }}>
                  SkillSync compares your profile against role requirements and highlights exactly what to improve.
                </p>
              </motion.div>
            )}

            {selectedRole && loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 14px' }} />
                  <p className="page-subtitle" style={{ fontSize: '0.875rem' }}>Analyzing your profile...</p>
                </div>
              </motion.div>
            )}

            {selectedRole && !loading && gapData && (
              <motion.div key={selectedRole} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="grid-2">
                  <div className="glass card" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <ScoreRing score={gapData.match_score} />
                    <div>
                      <h3 className="card-title" style={{ marginBottom: 8 }}>Readiness Score</h3>
                      <p className="page-subtitle" style={{ fontSize: '0.8rem' }}>
                        Matching <strong>{gapData.match_count}</strong> of <strong>{gapData.total_required}</strong> required skills
                      </p>
                      <div style={{ marginTop: 12 }}>
                        <span className={`badge ${gapData.match_score >= 70 ? 'badge-success' : gapData.match_score >= 45 ? 'badge-primary' : 'badge-warning'}`}>
                          {gapData.match_score >= 70 ? 'Industry Ready' : gapData.match_score >= 45 ? 'Developing' : 'Needs Focus'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="glass card" style={{ background: 'rgba(14, 165, 233, 0.06)' }}>
                    <h3 className="card-title" style={{ color: 'var(--primary)', marginBottom: 10 }}>
                      <Zap size={16} /> Quick Analysis
                    </h3>
                    <p className="page-subtitle" style={{ fontSize: '0.83rem' }}>
                      You already match <strong>{gapData.match_count}</strong> skills. Prioritize the next {Math.min(3, gapData.missing_skills.length)} missing areas to improve fit for <strong>{selectedRole}</strong>.
                    </p>
                  </div>
                </div>

                <div className="glass card">
                  <h3 className="card-title" style={{ marginBottom: 18 }}>
                    <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
                    Missing Skills
                    <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>{gapData.missing_skills.length} gaps</span>
                  </h3>

                  {gapData.missing_skills.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '28px 0' }}>
                      <CheckCircle size={48} style={{ color: '#16a34a', margin: '0 auto 12px', display: 'block' }} />
                      <h4 className="panel-title">Great match</h4>
                      <p className="page-subtitle" style={{ marginTop: 6 }}>You currently meet all required skills for {selectedRole}.</p>
                    </div>
                  ) : (
                    <div className="grid-2" style={{ gap: 10 }}>
                      {gapData.missing_skills.map((skill, index) => (
                        <motion.div key={skill} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="missing-skill-row">
                          <div className="missing-skill-icon">
                            <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p className="missing-skill-title">{skill}</p>
                            <p className="status-subcopy">Required for {selectedRole}</p>
                          </div>
                          <BookOpen size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SkillGap;
