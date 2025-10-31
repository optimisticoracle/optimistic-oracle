import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  return (
    <WalletMultiButton 
      style={{
        background: 'linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)',
        borderRadius: '8px',
        padding: '8px 20px',
        fontSize: '14px',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
        transition: 'all 0.3s ease',
        height: 'auto',
        lineHeight: '1.4',
      }}
    />
  );
}