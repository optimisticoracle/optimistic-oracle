import React, { useState, useEffect } from 'react';
import './App.css';

interface RequestData {
  id: string;
  requestId: number;
  requester: string;
  question: string;
  reward: number;
  bond: number;
  expiryTime: number;
  challengePeriod: number;
  status: string;
  answer?: string;
  proposer?: string;
  proposedAt?: number;
  challengeEndsAt?: string;
  dataSource?: string;
  createdAt: string;
}

interface Stats {
  totalRequests: number;
  activeRequests: number;
  resolvedRequests: number;
  totalValueLocked: number;
}

// Environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function App() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState(60);
  const [reward, setReward] = useState(0.1);
  const [bond, setBond] = useState(0.05);
  const [challengeHours, setChallengeHours] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/requests`),
        fetch(`${API_BASE_URL}/stats`)
      ]);

      const requestsData = await requestsRes.json();
      const statsData = await statsRes.json();

      setRequests(requestsData.data || []);
      setStats(statsData.data || null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          expiryMinutes,
          rewardSOL: reward,
          bondSOL: bond,
          challengeHours
        })
      });

      if (response.ok) {
        alert('Request created successfully!');
        setShowCreateForm(false);
        fetchData();
        // Reset form
        setQuestion('');
        setExpiryMinutes(60);
        setReward(0.1);
        setBond(0.05);
        setChallengeHours(1);
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handlePropose = async (requestId: number, answer: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests/${requestId}/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });

      if (response.ok) {
        alert(`Proposed answer: ${answer}`);
        fetchData();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'created': return '#3B82F6';
      case 'proposed': return '#FBBF24';
      case 'resolved': return '#10B981';
      case 'disputed': return '#F87171';
      default: return '#64748B';
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading Oracle Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Lightning Background */}
      <div className="lightning-bg">
        <div className="lightning lightning-1"></div>
        <div className="lightning lightning-2"></div>
        <div className="lightning lightning-3"></div>
      </div>

      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <img src="/logo.png" alt="Logo" className="header-logo" />
            <div className="header-text">
              <h1 className="header-title">OPTIMISTIC ORACLE</h1>
              <div className="tagline">Truth by Default, Verified by Economics.</div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <section className="stats-section">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-card">
                <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="stat-value">{stats.totalRequests}</div>
                <div className="stat-label">Total Requests</div>
              </div>
              <div className="stat-card">
                <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="stat-value">{stats.activeRequests}</div>
                <div className="stat-label">Active</div>
              </div>
              <div className="stat-card">
                <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="stat-value">{stats.resolvedRequests}</div>
                <div className="stat-label">Resolved</div>
              </div>
              <div className="stat-card">
                <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div className="stat-value">{stats.totalValueLocked.toFixed(2)} SOL</div>
                <div className="stat-label">Total Value Locked</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Actions */}
      <section className="actions-section">
        <div className="container">
          <button 
            className="btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Request
              </>
            )}
          </button>
          <button 
            className="btn-secondary"
            onClick={fetchData}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </section>

      {/* Create Form */}
      {showCreateForm && (
        <section className="form-section">
          <div className="container">
            <div className="form-card">
              <h2>Create Oracle Request</h2>
              <form onSubmit={handleCreateRequest}>
                <div className="form-group">
                  <label>Question</label>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Will Bitcoin reach $100,000 by end of 2025?"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry (minutes)</label>
                    <input
                      type="number"
                      value={expiryMinutes}
                      onChange={(e) => setExpiryMinutes(Number(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Reward (SOL)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={reward}
                      onChange={(e) => setReward(Number(e.target.value))}
                      min="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Bond (SOL)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bond}
                      onChange={(e) => setBond(Number(e.target.value))}
                      min="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Challenge Period (hours)</label>
                    <input
                      type="number"
                      value={challengeHours}
                      onChange={(e) => setChallengeHours(Number(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-submit">Create Request</button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Requests */}
      <section className="requests-section">
        <div className="container">
          <h2 className="section-title">Oracle Requests</h2>
          
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {requests.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3>No requests yet</h3>
              <p>Create your first oracle request to get started!</p>
            </div>
          ) : (
            <div className="requests-grid">
              {requests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(request.status) }}
                    >
                      {request.status}
                    </span>
                    <span className="request-id">#{request.requestId}</span>
                  </div>
                  
                  <h3 className="request-question">{request.question}</h3>
                  
                  <div className="request-details">
                    <div className="detail-row">
                      <span className="detail-label">Reward:</span>
                      <span className="detail-value">{request.reward} SOL</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Bond:</span>
                      <span className="detail-value">{request.bond} SOL</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Challenge:</span>
                      <span className="detail-value">{request.challengePeriod}s</span>
                    </div>
                  </div>

                  {request.answer && (
                    <div className="answer-section">
                      <div className="answer-label">Proposed Answer:</div>
                      <div className="answer-value">{request.answer}</div>
                      {request.challengeEndsAt && (
                        <div className="challenge-timer">
                          Challenge ends: {new Date(request.challengeEndsAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  {request.status.toLowerCase() === 'created' && (
                    <div className="action-buttons">
                      <button
                        className="btn-yes"
                        onClick={() => handlePropose(request.requestId, 'YES')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Propose YES
                      </button>
                      <button
                        className="btn-no"
                        onClick={() => handlePropose(request.requestId, 'NO')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Propose NO
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-bottom">
            <p>&copy; 2025 Optimistic Oracle. Open source under MIT License.</p>
            <p className="footer-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16v2h2v-2h-2zm0-6v4h2v-4h-2z"/>
              </svg>
              Solana Devnet Mode - Not for Production
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
