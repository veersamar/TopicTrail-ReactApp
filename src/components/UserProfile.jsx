import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function UserProfile() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user?.id) {
          const profileData = await api.getUserProfile(token, user.id);
          setProfile(profileData);
        }
        const historyData = await api.getLoginHistory(token);
        setLoginHistory(historyData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, token]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-lg my-4" style={{ maxWidth: '900px' }}>
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                   style={{ width: '100px', height: '100px' }}>
                <span className="text-white" style={{ fontSize: '48px' }}>
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <h5>{user?.name || user?.email}</h5>
              <p className="text-muted small">{user?.email}</p>
              <button className="btn btn-primary btn-sm w-100">Edit Profile</button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                    role="tab"
                  >
                    <i className="bi bi-person me-2"></i>Profile Info
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                    role="tab"
                  >
                    <i className="bi bi-clock-history me-2"></i>Login History
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body">
              {/* Profile Info Tab */}
              {activeTab === 'info' && (
                <div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted">Email</label>
                      <p className="form-control-plaintext">{user?.email}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted">Name</label>
                      <p className="form-control-plaintext">{user?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Login History Tab */}
              {activeTab === 'history' && (
                <div>
                  {loginHistory.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>IP Address</th>
                            <th>Device</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loginHistory.map((session, idx) => (
                            <tr key={idx}>
                              <td>{new Date(session.loginTime).toLocaleString()}</td>
                              <td><code>{session.ipAddress}</code></td>
                              <td>{session.userAgent?.substring(0, 40)}...</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted">No login history found</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;