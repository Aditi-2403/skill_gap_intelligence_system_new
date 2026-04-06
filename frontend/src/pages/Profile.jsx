import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Save, SlidersHorizontal, Upload, X } from 'lucide-react';

import { getDomains, getIndustryRoles } from '../api/analysisApi';
import {
  getAnalysisPreferences,
  getProfile,
  updateAnalysisPreferences,
  uploadResume,
  upsertProfile,
} from '../api/profileApi';

const Profile = () => {
  const asText = (value) => (typeof value === 'string' ? value : '');

  const [formData, setFormData] = useState({
    full_name: '',
    cgpa: '',
    branch: '',
    year: '1',
    skills: '',
    certifications: '',
    projects: '',
    internships: '',
  });
  const [domains, setDomains] = useState([]);
  const [roles, setRoles] = useState([]);
  const [preferences, setPreferences] = useState({
    target_domain: '',
    target_role: '',
    skill_levels: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [toast, setToast] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const skills = asText(formData.skills)
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3400);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [profileData, domainRows, prefRows] = await Promise.all([
          getProfile().catch(() => null),
          getDomains(),
          getAnalysisPreferences().catch(() => null),
        ]);

        if (profileData) {
          setFormData({
            ...profileData,
            full_name: asText(profileData.full_name),
            branch: asText(profileData.branch),
            skills: asText(profileData.skills),
            certifications: asText(profileData.certifications),
            projects: asText(profileData.projects),
            internships: asText(profileData.internships),
            cgpa: String(profileData.cgpa || ''),
            year: String(profileData.year || 1),
          });
        }

        setDomains(domainRows || []);
        const fallbackDomain = asText(prefRows?.target_domain) || domainRows?.[0]?.domain || '';
        setPreferences((current) => ({
          ...current,
          target_domain: fallbackDomain,
          target_role: asText(prefRows?.target_role),
          skill_levels: Array.isArray(prefRows?.skill_levels) ? prefRows.skill_levels : [],
        }));
      } catch {
        showToast('error', 'Unable to load profile setup.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!preferences.target_domain) return;
    const loadRoles = async () => {
      try {
        const roleRows = await getIndustryRoles(preferences.target_domain);
        setRoles(roleRows || []);
        if ((!preferences.target_role || !roleRows?.some((row) => row.role === preferences.target_role)) && roleRows?.length) {
          setPreferences((current) => ({ ...current, target_role: roleRows[0].role }));
        }
      } catch {
        setRoles([]);
      }
    };
    loadRoles();
  }, [preferences.target_domain]);

  useEffect(() => {
    setPreferences((current) => {
      const existingMap = Object.fromEntries((current.skill_levels || []).map((row) => [row.skill.toLowerCase(), row.level]));
      const merged = skills.map((skill) => ({ skill, level: existingMap[skill.toLowerCase()] || 5 }));
      return { ...current, skill_levels: merged };
    });
  }, [formData.skills]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!preferences.target_domain || !preferences.target_role) {
      showToast('error', 'Please select target domain and target role.');
      return;
    }
    setSaving(true);
    try {
      await upsertProfile({
        ...formData,
        cgpa: Number.parseFloat(formData.cgpa) || 0,
        year: Number.parseInt(formData.year, 10) || 1,
      });
      await updateAnalysisPreferences(preferences);
      showToast('success', 'Profile and preferences saved.');
    } catch (error) {
      showToast('error', error?.response?.data?.detail || 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const next = skillInput.trim();
    if (!next || skills.includes(next)) {
      setSkillInput('');
      return;
    }
    setFormData((current) => ({ ...current, skills: [...skills, next].join(', ') }));
    setSkillInput('');
  };

  const removeSkill = (skillToRemove) => {
    setFormData((current) => ({
      ...current,
      skills: skills.filter((skill) => skill !== skillToRemove).join(', '),
    }));
  };

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('error', 'Please upload a valid PDF file.');
      return;
    }

    const payload = new FormData();
    payload.append('file', file);
    setUploading(true);
    try {
      const result = await uploadResume(payload);
      const extractedSkills = result.extracted_skills || [];
      const merged = Array.from(new Set([...skills, ...extractedSkills]));
      setFormData((current) => ({ ...current, skills: merged.join(', ') }));
      showToast('success', `Extracted ${extractedSkills.length} skills.`);
    } catch {
      showToast('error', 'Resume parsing failed.');
    } finally {
      setUploading(false);
    }
  };

  const setSkillLevel = (skill, level) => {
    setPreferences((current) => ({
      ...current,
      skill_levels: current.skill_levels.map((row) => (row.skill === skill ? { ...row, level } : row)),
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'}`}
            style={{ position: 'fixed', top: 20, right: 20, zIndex: 900 }}
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
          >
            {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="page-title">Universal Profile Setup</h1>
        <p className="page-subtitle">Set your academic details, domain path, role target, and skill levels.</p>
      </div>

      {loading && (
        <div className="glass card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p className="page-subtitle">Loading your profile...</p>
          </div>
        </div>
      )}

      {!loading && (

      <form onSubmit={onSubmit} className="profile-layout">
        <section className="glass card">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="input-field" name="full_name" value={formData.full_name} onChange={(event) => setFormData((current) => ({ ...current, full_name: event.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Branch / Department</label>
              <input className="input-field" name="branch" value={formData.branch} onChange={(event) => setFormData((current) => ({ ...current, branch: event.target.value }))} required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">CGPA</label>
              <input type="number" step="0.01" min="0" max="10" className="input-field" value={formData.cgpa} onChange={(event) => setFormData((current) => ({ ...current, cgpa: event.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <select className="input-field" value={formData.year} onChange={(event) => setFormData((current) => ({ ...current, year: event.target.value }))}>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Target Domain</label>
              <select className="input-field" value={preferences.target_domain} onChange={(event) => setPreferences((current) => ({ ...current, target_domain: event.target.value, target_role: '' }))}>
                {domains.map((domain) => (
                  <option key={domain.domain} value={domain.domain}>{domain.domain}</option>
                ))}
                {!domains.length && <option value="">No domain available</option>}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Target Role</label>
              <select className="input-field" value={preferences.target_role} onChange={(event) => setPreferences((current) => ({ ...current, target_role: event.target.value }))}>
                {roles.map((role) => (
                  <option key={role.role} value={role.role}>{role.role}</option>
                ))}
                {!roles.length && <option value="">No role available</option>}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Skills</label>
            <div className="skill-input-surface">
              {skills.map((skill) => (
                <span key={skill} className="skill-tag">
                  {skill}
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeSkill(skill)}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <input
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault();
                    addSkill();
                  }
                }}
                onBlur={addSkill}
                className="skill-input"
                placeholder={skills.length ? 'Add more skills...' : 'Type a skill and press Enter'}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Certifications</label>
            <input className="input-field" value={formData.certifications} onChange={(event) => setFormData((current) => ({ ...current, certifications: event.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Projects</label>
            <input className="input-field" value={formData.projects} onChange={(event) => setFormData((current) => ({ ...current, projects: event.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Internships</label>
            <input className="input-field" value={formData.internships} onChange={(event) => setFormData((current) => ({ ...current, internships: event.target.value }))} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 6 }} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Profile & Preferences'}
          </button>
        </section>

        <section style={{ display: 'grid', gap: 18 }}>
          <div className="glass card">
            <h3 className="card-title"><Upload size={16} style={{ color: 'var(--primary)' }} /> Resume Skill Extractor</h3>
            <div
              className={`upload-zone ${dragging ? 'drag-over' : ''}`}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                handleFiles(event.dataTransfer.files);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={(event) => handleFiles(event.target.files)} />
              {uploading ? <div className="spinner" style={{ margin: '0 auto' }} /> : <p className="page-subtitle">Drop PDF or click to upload</p>}
            </div>
          </div>

          <div className="glass card">
            <h3 className="card-title"><SlidersHorizontal size={16} style={{ color: 'var(--primary)' }} /> Skill Levels (1-10)</h3>
            {preferences.skill_levels.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {preferences.skill_levels.map((row) => (
                  <div key={row.skill} className="skill-level-row">
                    <label>{row.skill}</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={row.level}
                      onChange={(event) => setSkillLevel(row.skill, Number.parseInt(event.target.value, 10))}
                    />
                    <span className="badge badge-primary">L{row.level}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="page-subtitle">Add skills to start rating your proficiency.</p>
            )}
          </div>
        </section>
      </form>
      )}
    </div>
  );
};

export default Profile;
