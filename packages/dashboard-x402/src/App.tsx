import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from './components/WalletButton';
import { RequestCard } from './components/RequestCard';
import { Request, CreateRequestForm } from './types';

const API_URL = 'http://localhost:3000';

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
      setRequests(data.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
              ⚡ Optimistic Oracle
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
              Truth by Default, Verified by Economics
            </p>
          </div>
          <WalletButton />
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Action Bar */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              Oracle Requests
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
              {requests.length} active requests
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={!connected}
            style={{
              backgroundColor: connected ? '#9945FF' : '#9ca3af',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: connected ? 'pointer' : 'not-allowed',
            }}
          >
            {showCreateForm ? 'Cancel' : '+ Create Request'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              Create Oracle Request
            </h3>
            <form onSubmit={handleCreateRequest}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
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
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Answer Type
                  </label>
                  <select
                    value={createForm.answerType}
                    onChange={(e) => setCreateForm({ ...createForm, answerType: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                    }}
                  >
                    <option value="YesNo">Yes/No</option>
                    <option value="MultipleChoice">Multiple Choice</option>
                    <option value="Numeric">Numeric</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Data Source
                  </label>
                  <input
                    type="text"
                    value={createForm.dataSource}
                    onChange={(e) => setCreateForm({ ...createForm, dataSource: e.target.value })}
                    placeholder="https://example.com"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
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
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
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
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
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
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
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
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#9945FF',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Create Request (Payment Required)
              </button>
            </form>
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>
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
