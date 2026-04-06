import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Layers, Trash2, TrendingUp, Users } from 'lucide-react';

import { deleteAdminStudent, getAdminDashboard } from '../api/adminApi';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingStudentId, setDeletingStudentId] = useState(null);

  const loadDashboard = async ({ showLoader = false } = {}) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const result = await getAdminDashboard();
      setData(result);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail
        || requestError?.message
        || 'Unable to load admin dashboard data.',
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard({ showLoader: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteStudent = async (student) => {
    const confirmed = window.confirm(`Delete student "${student?.name || student?.email}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingStudentId(student.id);
      await deleteAdminStudent(student.id);
      await loadDashboard();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail
        || requestError?.message
        || 'Unable to delete this student right now.',
      );
    } finally {
      setDeletingStudentId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <span className="badge badge-warning">Admin Analytics</span>
        <h1 className="page-title">Cross-Domain Overview</h1>
        <p className="page-subtitle">Performance and risk trends across all supported domains.</p>
      </motion.div>
      {error && (
        <div className="alert alert-danger" style={{ width: 'fit-content', maxWidth: '100%' }}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <div className="admin-stats-grid">
        <div className="glass admin-stat-card">
          <div className="stat-icon-wrap"><Users size={20} /></div>
          <div className="stat-value">{data?.total_students || 0}</div>
          <div className="stat-title">Total Students</div>
          <div className="stat-label">Registered across all domains</div>
        </div>
        <div className="glass admin-stat-card">
          <div className="stat-icon-wrap"><TrendingUp size={20} /></div>
          <div className="stat-value">{data?.average_readiness_score || 0}%</div>
          <div className="stat-title">Avg Readiness</div>
          <div className="stat-label">Based on latest role mapping</div>
        </div>
        <div className="glass admin-stat-card">
          <div className="stat-icon-wrap"><AlertTriangle size={20} /></div>
          <div className="stat-value">{data?.students_below_threshold || 0}</div>
          <div className="stat-title">At Risk Students</div>
          <div className="stat-label">Readiness below threshold</div>
        </div>
      </div>

      <div className="grid-2">
        <section className="glass card">
          <h3 className="card-title"><Layers size={18} style={{ color: 'var(--primary)' }} /> Domain Distribution</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {(data?.domain_stats || []).map((row) => (
              <div key={row.domain} className="list-row">
                <span>{row.domain}</span>
                <span className="badge badge-primary">{row.students}</span>
              </div>
            ))}
            {!data?.domain_stats?.length && <p className="page-subtitle">No domain preferences submitted yet.</p>}
          </div>
        </section>

        <section className="glass card">
          <h3 className="card-title"><AlertTriangle size={18} style={{ color: 'var(--warning)' }} /> Common Missing Skills</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {(data?.most_common_missing_skills || []).map((row) => (
              <div key={row.skill} className="list-row">
                <span>{row.skill}</span>
                <span className="badge badge-danger">{row.count}</span>
              </div>
            ))}
            {!data?.most_common_missing_skills?.length && <p className="page-subtitle">No missing skill trend available yet.</p>}
          </div>
        </section>
      </div>

      <section className="glass card">
        <h3 className="card-title"><Users size={18} style={{ color: 'var(--primary)' }} /> Student Directory ({data?.total_students || 0})</h3>
        <p className="page-subtitle" style={{ marginTop: -8, marginBottom: 12 }}>
          View all students and remove records when needed.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {(data?.students || []).map((student) => (
            <div key={student.id} className="list-row student-list-row" style={{ alignItems: 'center' }}>
              <div className="student-list-meta">
                <strong>{student.name || 'N/A'}</strong>
                <span>
                  {student.email}
                  {' • '}
                  {student.domain || 'Not selected'}
                  {' • '}
                  {student.target_role || 'Not selected'}
                  {' • '}
                  CGPA {student.cgpa ?? 0}
                  {' • '}
                  Readiness {student.readiness_score ?? 0}%
                </span>
              </div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDeleteStudent(student)}
                disabled={deletingStudentId === student.id}
                style={{ minWidth: 120 }}
              >
                <Trash2 size={14} />
                {deletingStudentId === student.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ))}
          {!data?.students?.length && <p className="page-subtitle">No students found.</p>}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
