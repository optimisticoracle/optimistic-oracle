import { Request } from '../types';
import { formatDate, formatUsdc, getStatusColor, getTimeRemaining, shortenAddress } from '../utils';

interface RequestCardProps {
  request: Request;
  onPropose?: (requestId: number) => void;
  onDispute?: (requestId: number) => void;
}

export function RequestCard({ request, onPropose, onDispute }: RequestCardProps) {
  const statusColor = getStatusColor(request.status);
  const timeRemaining = getTimeRemaining(request.expiryTimestamp);

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
      backgroundColor: 'white',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div>
          <span style={{
            backgroundColor: statusColor,
            color: 'white',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600',
          }}>
            {request.status}
          </span>
          <span style={{ marginLeft: '12px', color: '#6b7280', fontSize: '14px' }}>
            Request #{request.requestId}
          </span>
        </div>
        <div style={{ textAlign: 'right', fontSize: '14px', color: '#6b7280' }}>
          Expires: {timeRemaining}
        </div>
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
        {request.question}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Type</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{request.answerType}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Reward</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{formatUsdc(request.rewardAmount)}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Bond Required</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{formatUsdc(request.bondAmount)}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Creator</div>
          <div style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'monospace' }}>
            {shortenAddress(request.creator)}
          </div>
        </div>
      </div>

      {request.answer && (
        <div style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '12px', 
          borderRadius: '8px',
          marginBottom: '12px' 
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
            Proposed Answer by {shortenAddress(request.proposer || '')}
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            {request.answer}
          </div>
        </div>
      )}

      {request.status === 'Created' && onPropose && (
        <button
          onClick={() => onPropose(request.requestId)}
          style={{
            background: 'linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)',
            boxShadow: '0 10px 30px rgba(20, 184, 166, 0.3)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Propose Answer
        </button>
      )}

      {request.status === 'Proposed' && onDispute && (
        <button
          onClick={() => onDispute(request.requestId)}
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Dispute Answer
        </button>
      )}
    </div>
  );
}
