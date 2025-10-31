import React, { useEffect, useState } from 'react';
import './App.css';

// Environment variables with fallbacks
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || '/dashboard';
const DOCS_URL = import.meta.env.VITE_DOCS_URL || '/docs';
const GITHUB_URL = import.meta.env.VITE_GITHUB_URL || 'https://github.com/optimisticoracle/optimistic-oracle';

function App() {
  const [scrollY, setScrollY] = useState(0);
  const [copied, setCopied] = useState(false); 

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app">
      {/* Navigation */}
      <nav className={`nav ${scrollY > 50 ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="nav-content">
            <div className="nav-logo">
              <img src="/logo.png" alt="Logo" className="logo-image" />
              <span className="logo-text">OPTIMISTIC ORACLE</span>
            </div>
            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="#comparison">Comparison</a>
              <a href="#technical">Technical</a>
              <a href="#use-cases">Use Cases</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Lightning Animation */}
      <section className="hero">
        <div className="lightning-bg">
          <div className="lightning lightning-1"></div>
          <div className="lightning lightning-2"></div>
          <div className="lightning lightning-3"></div>
          <div className="lightning lightning-4"></div>
          <div className="lightning lightning-5"></div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Now on Solana Devnet
            </div>
            
            <h1 className="hero-title">
              This is <span className="gradient-text">Optimistic Oracle</span>
            </h1>
            
            <p className="hero-subtitle">
              Truth by Default, Verified by Economics.
              <br />
              Decentralized data feeds with economic guarantees.
            </p>

            {/* CTA buttons */}
            <div className="hero-cta">
              {/* Disabled Try Demo */}
              <div className="btn-cta primary disabled" title="Work in progress">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Try Demo
              </div>

              {/* GitHub button */}
              <a href={GITHUB_URL} className="btn-secondary" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>

            {/* Trust + Token address */}
            <div className="hero-trust">
              <span className="trust-text">Trusted by developers building on Solana</span>

              {/* adress box */}
              <div className="token-box">
                <p className="token-label">$OPTIM</p>

                <div
                  className="token-placeholder"
                  onClick={() => {
                    const fullAddress = '86BMwo29TgobuYTCFU7tf3DBhgNvgeCkNTQXbAvUpump'; 
                    navigator.clipboard.writeText(fullAddress);

                    // trigger tooltip
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {/* copy icon */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 4h2a2 2 0 012 2v12a2 2 0 01-2 2h-2m-4 0H6a2 2 0 01-2-2V6a2 2 0 012-2h6a2 2 0 012 2v14z"
                    />
                  </svg>

                  {/* short display only */}
                  <code className="token-address">86BMwo..pump</code>

                  {/* tooltip when copied = true */}
                  {copied && (
                    <span className="copy-tooltip">Copied!</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Optimistic Oracle?</h2>
            <p className="section-subtitle">
              Traditional oracle solutions face three fundamental challenges: the <strong>Oracle Trilemma</strong> of security, speed, and cost. 
              Most protocols force you to choose two out of three. <span className="gradient-text">Optimistic Oracle</span> breaks this paradigm.
            </p>
          </div>

          <div className="features-grid six">
            {/* 1 */}
            <div className="feature-card">
              <div className="feature-icon" style={{background: 'linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)'}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3>Lightning Fast</h3>
              <p>Sub-second finality on Solana enables real-time data verification. No waiting for consensus from multiple validators.</p>
            </div>

            {/* 2 */}
            <div className="feature-card">
              <div className="feature-icon" style={{background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3>Cost Effective</h3>
              <p>Solana’s low transaction costs (fraction of a cent) make oracle queries economically viable at any scale.</p>
            </div>

            {/* 3 */}
            <div className="feature-card">
              <div className="feature-icon" style={{background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)'}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3>Cryptographically Secure</h3>
              <p>Economic incentives backed by bonding ensure data integrity. Challenge periods add additional security.</p>
            </div>

            {/* 4 */}
            <div className="feature-card">
              <div className="feature-icon" style={{background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3>Multi-Purpose Oracle</h3>
              <p>Not limited to prediction markets. Supports DeFi pricing, event verification, IoT data, and other real-world needs.</p>
            </div>

            {/* 5 */}
            <div className="feature-card">
              <div className="feature-icon" style={{background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)'}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M9 18h6" />
                </svg>
              </div>
              <h3>Dispute Resolution</h3>
              <p>Transparent and fair challenge mechanism with economic penalties for malicious actors.</p>
            </div>

            {/* 6 */}
            <div className="feature-card">
              <div className="feature-icon" style={{background: 'linear-gradient(135deg, #14B8A6 0%, #22D3EE 100%)'}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h3>Scalable Architecture</h3>
              <p>Built for Web3 scale. Handles millions of requests without compromising performance.</p>
            </div>
          </div>
        </div>
      </section>


      {/* Comparison with UMA */}
      <section id="comparison" className="comparison">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How We Compare</h2>
            <p className="section-subtitle">Optimistic Oracle vs UMA Protocol (used by Polymarket)</p>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Aspect</th>
                  <th>UMA Protocol (Ethereum)</th>
                  <th>Optimistic Oracle (Solana)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Transaction Speed</td>
                  <td>~15 seconds per block</td>
                  <td><strong>✓ 400ms finality</strong></td>
                </tr>
                <tr>
                  <td>Transaction Cost</td>
                  <td>$5–$50 per request (gas fees)</td>
                  <td><strong>✓ $0.00025 per request</strong></td>
                </tr>
                <tr>
                  <td>Throughput</td>
                  <td>~15 TPS (limited by Ethereum)</td>
                  <td><strong>✓ 65,000 TPS theoretical</strong></td>
                </tr>
                <tr>
                  <td>Challenge Period</td>
                  <td>Typically 2–3 hours minimum</td>
                  <td><strong>✓ Configurable: 1 minute to hours</strong></td>
                </tr>
                <tr>
                  <td>Dispute Resolution</td>
                  <td>DVM (Data Verification Mechanism)</td>
                  <td><strong>✓ Decentralized resolver network</strong></td>
                </tr>
                <tr>
                  <td>Token Integration</td>
                  <td>UMA token for governance</td>
                  <td><strong>✓ OPTIM for governance + staking</strong></td>
                </tr>
                <tr>
                  <td>Developer Experience</td>
                  <td>Solidity, EVM tooling</td>
                  <td><strong>✓ Rust, Anchor framework</strong></td>
                </tr>
                <tr>
                  <td>Network Effects</td>
                  <td>Strong Ethereum ecosystem</td>
                  <td><strong>✓ Growing Solana DeFi ecosystem</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="comparison-note">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p><strong>Why faster than UMA?</strong> We use Solana's sub-second finality + optimistic approach. UMA runs on Ethereum with multi-hour dispute windows.</p>
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section id="technical" className="technical">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Technical Architecture</h2>
          <p className="section-subtitle">
              Optimistic Oracle is architected as a <strong>modular protocol</strong> with three core layers:
            </p>
          </div>

          <div className="technical-grid">
            {/* 1️⃣ Data Request Layer */}
            <div className="technical-card">
              <h3>1. Data Request Layer</h3>
              <p>Smart contracts create data requests with parameters including:</p>
              <ul>
                <li><strong>Question/Query:</strong> The data being requested</li>
                <li><strong>Reward Amount:</strong> Payment for correct data provision</li>
                <li><strong>Bond Amount:</strong> Collateral required from data providers</li>
                <li><strong>Challenge Period:</strong> Time window for disputes</li>
                <li><strong>Expiry Timestamp:</strong> Deadline for data submission</li>
              </ul>
            </div>

            {/* 2️⃣ Proposal & Verification Layer */}
            <div className="technical-card">
              <h3>2. Proposal &amp; Verification Layer</h3>
              <p>Data providers (proposers) submit answers by:</p>
              <ul>
                <li>Staking the required bond amount in SOL</li>
                <li>Submitting their answer/data</li>
                <li>Entering the challenge period where anyone can dispute</li>
              </ul>
            </div>

            {/* 3️⃣ Dispute Resolution Layer */}
            <div className="technical-card">
              <h3>3. Dispute Resolution Layer</h3>
              <p>If a proposal is challenged:</p>
              <ul>
                <li>Challenger stakes a bond equal to the proposer’s bond</li>
                <li>Dispute is escalated to resolution mechanism</li>
                <li>Correct party receives both bonds plus rewards</li>
                <li>Incorrect party loses their bond</li>
              </ul>
              <div className="info-box">
                <strong>Security Model:</strong> The protocol’s security is mathematically guaranteed by making the cost of attack exceed the potential benefit. Bond mechanisms ensure <em>skin in the game</em>.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="use-cases">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Oracle Applications</h2>
            <p className="section-subtitle">A general-purpose oracle protocol supporting diverse use case</p>
          </div>

          <div className="use-cases-grid">
            {/* 1️⃣ Prediction Markets */}
            <div className="use-case-card">
              <div className="use-case-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3>Prediction Markets</h3>
              <p>Create decentralized prediction markets for sports, elections, and market events with provably fair resolution.</p>
              <div className="use-case-stats">
                <div className="stat-item">
                  <span className="stat-number">$2M+</span>
                  <span className="stat-label">Volume Potential</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">&lt;1s</span>
                  <span className="stat-label">Settlement Time</span>
                </div>
              </div>
            </div>

            {/* 2️⃣ Insurance Protocols */}
            <div className="use-case-card">
              <div className="use-case-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3>Insurance Protocols</h3>
              <p>Automate insurance claims and payouts based on verified real-world events and parametric triggers.</p>
              <div className="use-case-stats">
                <div className="stat-item">
                  <span className="stat-number">99.9%</span>
                  <span className="stat-label">Accuracy</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">Instant</span>
                  <span className="stat-label">Payouts</span>
                </div>
              </div>
            </div>

            {/* 3️⃣ DeFi Protocols */}
            <div className="use-case-card">
              <div className="use-case-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3>DeFi Protocols</h3>
              <p>Power lending, derivatives, and synthetic assets with reliable price feeds and market data at 100x lower cost.</p>
              <div className="use-case-stats">
                <div className="stat-item">
                  <span className="stat-number">100x</span>
                  <span className="stat-label">Cheaper</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">Any Data</span>
                  <span className="stat-label">Flexible</span>
                </div>
              </div>
            </div>

            {/* 4️⃣ Gaming & NFTs */}
            <div className="use-case-card">
              <div className="use-case-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3>Gaming & NFTs</h3>
              <p>Integrate real-world events into on-chain games and dynamic NFTs that respond to verified external data.</p>
              <div className="use-case-stats">
                <div className="stat-item">
                  <span className="stat-number">Real-time</span>
                  <span className="stat-label">Updates</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">Verifiable</span>
                  <span className="stat-label">Data</span>
                </div>
              </div>
            </div>

            {/* 5️⃣ Supply Chain & IoT */}
            <div className="use-case-card">
              <div className="use-case-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l1 6H6l1-6zm10-6h2a2 2 0 012 2v3H3V9a2 2 0 012-2h2m0 0l1.2-4H14l1.2 4H7z" />
                </svg>
              </div>
              <h3>Supply Chain & IoT</h3>
              <p>Enable real-time tracking of goods, sensors, and logistics using on-chain verified IoT data and event triggers.</p>
              <div className="use-case-stats">
                <div className="stat-item">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">Traceability</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">Global</span>
                  <span className="stat-label">Coverage</span>
                </div>
              </div>
            </div>

            {/* 6️⃣ Governance & DAOs */}
            <div className="use-case-card">
              <div className="use-case-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18M8 21h8a2 2 0 002-2v-1H6v1a2 2 0 002 2zm0-18h8a2 2 0 012 2v1H6V5a2 2 0 012-2z" />
                </svg>
              </div>
              <h3>Governance & DAOs</h3>
              <p>Provide reliable on-chain data for DAO proposals, voting outcomes, and treasury transparency to strengthen decentralized governance.</p>
              <div className="use-case-stats">
                <div className="stat-item">
                  <span className="stat-number">On-chain</span>
                  <span className="stat-label">Voting</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Transparency</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>OPTIMISTIC ORACLE</h4>
              <p>The Next Generation Oracle. Built on Solana.</p>
              <div className="footer-social">
                <a href="https://x.com/OptimOracle" aria-label="X (Twitter)">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href={GITHUB_URL} aria-label="GitHub" target="_blank" rel="noopener noreferrer">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="https://discord.com" aria-label="Discord">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer-section">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#use-cases">Use Cases</a>
              <a href="#footer">Dashboard</a>
              <a href={DOCS_URL}>Documentation</a>
            </div>

            <div className="footer-section">
              <h4>Developers</h4>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="#">API Docs</a>
              <a href="#">SDK Guide</a>
              <a href="#">Examples</a>
            </div>
          </div>

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
