export interface Request {
  requestId: number;
  creator: string;
  question: string;
  answerType: 'YesNo' | 'MultipleChoice' | 'Numeric';
  rewardAmount: number;
  bondAmount: number;
  expiryTimestamp: number;
  challengePeriod: number;
  dataSource?: string;
  metadata?: string;
  status: 'Created' | 'Proposed' | 'Disputed' | 'Resolved' | 'Cancelled';
  createdAt: number;
  proposer?: string;
  proposalTime?: number;
  answer?: string;
  disputer?: string;
  disputeTime?: number;
  resolvedAt?: number;
}

export interface CreateRequestForm {
  question: string;
  answerType: 'YesNo' | 'MultipleChoice' | 'Numeric';
  rewardAmount: string;
  bondAmount: string;
  expiryMinutes: string;
  challengePeriodHours: string;
  dataSource: string;
}

export interface ProposeAnswerForm {
  requestId: number;
  answer: string;
}

export interface DisputeAnswerForm {
  requestId: number;
  counterAnswer: string;
  resolutionBounty: string;
}
