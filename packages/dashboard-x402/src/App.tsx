import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from './components/WalletButton';
import { RequestCard } from './components/RequestCard';
import { Request, CreateRequestForm } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function App() {
  const { publicKey, connected } = useWallet();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRequestForm>({
    question: '',
    answerType: 'YesNo',
    rewardAmount: '1',
    bondAmount: '10',
    expiryMinutes: '1440',
    challengePeriodHours: '24',
    dataSource: '',
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const response = await fetch(`${API_URL}/api/requests`);
      const data = await response.json();
      // Safety check: ensure data.data is array
      setRequests(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const expiryTimestamp = Math.floor(Date.now() / 1000) + parseInt(createForm.expiryMinutes) * 60;
      const challengePeriod = parseInt(createForm.challengePeriodHours) * 3600;

      const response = await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: createForm.question,
          answerType: createForm.answerType,
          rewardAmount: Math.floor(parseFloat(createForm.rewardAmount) * 1e6),
          bondAmount: Math.floor(parseFloat(createForm.bondAmount) * 1e6),
          expiryTimestamp,
          challengePeriod,
          creator: publicKey.toString(),
          dataSource: createForm.dataSource || undefined,
        }),
      });

      const data = await response.json();
      
      if (response.status === 402) {
        alert('Payment required! Please implement X402 payment flow.');
        return;
      }

      if (data.success) {
        alert('Request created successfully!');
        setShowCreateForm(false);
        fetchRequests();
      } else {
        alert('Error: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Error creating request');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(20, 184, 166, 0.1)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '40px', width: 'auto' }} />
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: '700',
                letterSpacing: '2px',
                background: 'linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0,
              }}>
                OPTIMISTIC ORACLE
              </h1>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', margin: 0 }}>
                Truth by Default, Verified by Economics
              </p>
            </div>
          </div>
          <WalletButton />
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Action Bar */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid rgba(20, 184, 166, 0.2)',
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#F1F5F9', margin: 0 }}>
              Oracle Requests
            </h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '8px', margin: 0 }}>
              {requests.length} active requests
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={!connected}
            style={{
              background: connected ? 'linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)' : '#334155',
              color: 'white',
              padding: '12px 28px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: connected ? 'pointer' : 'not-allowed',
              boxShadow: connected ? '0 10px 30px rgba(20, 184, 166, 0.3)' : 'none',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (connected) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(20, 184, 166, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (connected) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(20, 184, 166, 0.3)';
              }
            }}
          >
            {showCreateForm ? 'Cancel' : '+ Create Request'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '30px',
            border: '1px solid rgba(20, 184, 166, 0.2)',
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#F1F5F9' }}>
              Create Oracle Request
            </h3>
            <form onSubmit={handleCreateRequest}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#F1F5F9' }}>
                  Question *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.question}
                  onChange={(e) => setCreateForm({ ...createForm, question: e.target.value })}
                  placeholder="Will BTC reach $100k by end of 2025?"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    fontSize: '14px',
                    background: 'rgba(30, 41, 59, 0.6)',
                    color: '#F1F5F9',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#F1F5F9' }}>
                    Answer Type
                  </label>
                  <select
                    value={createForm.answerType}
                    onChange={(e) => setCreateForm({ ...createForm, answerType: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      fontSize: '14px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      color: '#F1F5F9',
                    }}
                  >
                    <option value="YesNo">Yes/No</option>
                    <option value="MultipleChoice">Multiple Choice</option>
                    <option value="Numeric">Numeric</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#F1F5F9' }}>
                    Data Source
                  </label>
                  <input
                    type="text"
                    value={createForm.dataSource}
                    onChange={(e) => setCreateForm({ ...createForm, dataSource: e.target.value })}
                    placeholder="https://example.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      fontSize: '14px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      color: '#F1F5F9',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#F1F5F9' }}>
                    Reward (USDC)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    value={createForm.rewardAmount}
                    onChange={(e) => setCreateForm({ ...createForm, rewardAmount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      fontSize: '14px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      color: '#F1F5F9',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#F1F5F9' }}>
                    Bond (USDC)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    value={createForm.bondAmount}
                    onChange={(e) => setCreateForm({ ...createForm, bondAmount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      fontSize: '14px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      color: '#F1F5F9',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#F1F5F9' }}>
                    Expiry (minutes)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={createForm.expiryMinutes}
                    onChange={(e) => setCreateForm({ ...createForm, expiryMinutes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      fontSize: '14px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      color: '#F1F5F9',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#F1F5F9' }}>
                    Challenge (hours)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={createForm.challengePeriodHours}
                    onChange={(e) => setCreateForm({ ...createForm, challengePeriodHours: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      fontSize: '14px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      color: '#F1F5F9',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)',
                  color: 'white',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                  boxShadow: '0 10px 30px rgba(20, 184, 166, 0.3)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(20, 184, 166, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(20, 184, 166, 0.3)';
                }}
              >
                Create Request (Payment Required)
              </button>
            </form>
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            border: '1px solid rgba(20, 184, 166, 0.2)',
          }}>
            <p style={{ fontSize: '18px', color: '#94A3B8' }}>
              No requests yet. Create the first one!
            </p>
          </div>
        ) : (
          <div>
            {requests.map((request) => (
              <RequestCard
                key={request.requestId}
                request={request}
                onPropose={(id) => alert(`Propose answer to request ${id}`)}
                onDispute={(id) => alert(`Dispute answer to request ${id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
