import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Compass, GaugeCircle, Target } from 'lucide-react';

import { getDomains, getIndustryRoles, getSkillGap } from '../api/analysisApi';
import { getAnalysisPreferences } from '../api/profileApi';

const SkillGap = () => {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [gapData, setGapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [domainList, prefs] = await Promise.all([getDomains(), getAnalysisPreferences()]);
        setDomains(domainList || []);

        const defaultDomain = prefs?.target_domain || domainList?.[0]?.domain || '';
        setSelectedDomain(defaultDomain);
      } catch {
        setError('Unable to load domains right now.');
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    if (!selectedDomain) return;
    const loadRoles = async () => {
      try {
        const roleRows = await getIndustryRoles(selectedDomain);
        setRoles(roleRows || []);
        const firstRole = roleRows?.[0]?.role || '';
        setSelectedRole(firstRole);
        setGapData(null);
      } catch {
        setError('Unable to load roles for this domain.');
      }
    };
    loadRoles();
  }, [selectedDomain]);

  const runAnalysis = async (roleName) => {
    setSelectedRole(roleName);
    setLoading(true);
    setError('');
    try {
      const result = await getSkillGap(roleName, selectedDomain);
      setGapData(result);
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || 'Unable to run analysis for selected role.');
    } finally {
      setLoading(false);
    }
  };

  const readinessTone = useMemo(() => {
    const score = gapData?.readiness_score || 0;
    if (score >= 70) return 'var(--tone-good)';
    if (score >= 40) return 'var(--tone-info)';
    return 'var(--tone-warn)';
  }, [gapData?.readiness_score]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Universal Skill Gap Engine</h1>
        <p className="page-subtitle">Choose any domain and role to get explainable readiness analysis.</p>
      </motion.div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="gap-toolbar glass">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Domain</label>
          <select className="input-field" value={selectedDomain} onChange={(event) => setSelectedDomain(event.target.value)}>
            {domains.map((domain) => (
              <option key={domain.domain} value={domain.domain}>{domain.domain}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="gap-layout">
        <section className="glass card">
          <h3 className="card-title"><Target size={18} style={{ color: 'var(--primary)' }} /> Roles</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {roles.map((role) => (
              <button
                key={role.role}
                className={`nav-link ${selectedRole === role.role ? 'active' : ''}`}
                onClick={() => runAnalysis(role.role)}
                type="button"
                style={{ justifyContent: 'space-between' }}
              >
                <span>{role.role}</span>
                <span className="badge badge-primary">{role.skills.length} skills</span>
              </button>
            ))}
          </div>
        </section>

        <section className="glass card">
          {!gapData && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 10px' }}>
              <Compass size={42} style={{ margin: '0 auto 10px', color: 'var(--text-subtle)' }} />
              <p className="page-subtitle">Select a role to run your personalized gap analysis.</p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '44px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p className="page-subtitle">Analyzing your profile...</p>
            </div>
          )}

          {gapData && !loading && (
            <div style={{ display: 'grid', gap: 18 }}>
              <div className="readiness-hero">
                <div>
                  <p className="status-subcopy">Selected Path</p>
                  <h3 className="panel-title">{gapData.domain} - {gapData.role}</h3>
                </div>
                <div className="readiness-pill" style={{ background: readinessTone }}>
                  <GaugeCircle size={16} />
                  {Math.round(gapData.readiness_score)}%
                </div>
              </div>

              <div className="grid-2">
                <div className="analysis-panel">
                  <h4><CheckCircle size={16} /> Matched Skills</h4>
                  <p>{gapData.match_count} of {gapData.total_required}</p>
                </div>
                <div className="analysis-panel">
                  <h4><AlertTriangle size={16} /> Risk</h4>
                  <p>{gapData.risk_status}</p>
                </div>
              </div>

              <div>
                <h4 className="panel-title" style={{ fontSize: '1rem', marginBottom: 10 }}>Missing Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {gapData.missing_skills.length ? gapData.missing_skills.map((skill) => (
                    <span key={skill} className="badge badge-danger">{skill}</span>
                  )) : <span className="badge badge-success">No missing skills</span>}
                </div>
              </div>

              <div>
                <h4 className="panel-title" style={{ fontSize: '1rem', marginBottom: 10 }}>Weak Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {gapData.weak_skills.length ? gapData.weak_skills.map((row) => (
                    <span key={row.skill} className="badge badge-warning">{row.skill} (L{row.level})</span>
                  )) : <span className="badge badge-success">No weak skills</span>}
                </div>
              </div>

              <div>
                <h4 className="panel-title" style={{ fontSize: '1rem', marginBottom: 10 }}>Next Best Actions</h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  {(gapData.recommendations || []).map((item, index) => (
                    <div key={item} className="action-item">
                      <span className="action-index">{index + 1}</span>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SkillGap;

