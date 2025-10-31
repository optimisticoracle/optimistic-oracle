/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Format SOL amount
 */
export function formatSol(lamports: number): string {
  return (lamports / 1e9).toFixed(4) + ' SOL';
}

/**
 * Format USDC amount
 */
export function formatUsdc(microUnits: number): string {
  return '$' + (microUnits / 1e6).toFixed(2);
}

/**
 * Shorten wallet address
 */
export function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'Created':
      return '#3b82f6'; // blue
    case 'Proposed':
      return '#f59e0b'; // amber
    case 'Disputed':
      return '#ef4444'; // red
    case 'Resolved':
      return '#10b981'; // green
    case 'Cancelled':
      return '#6b7280'; // gray
    default:
      return '#6b7280';
  }
}

/**
 * Calculate time remaining
 */
export function getTimeRemaining(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
