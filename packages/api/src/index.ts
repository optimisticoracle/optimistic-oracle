import * as dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import cors from 'cors';
import { OptimisticOracleSDK } from '@optimistic-oracle/sdk';

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*'
}));
app.use(express.json());

// Load wallet from .env
const WALLET_SECRET = process.env.WALLET_SECRET_KEY;
let sdk: OptimisticOracleSDK;

if (WALLET_SECRET && WALLET_SECRET.startsWith('[')) {
  try {
    // Parse wallet array from .env
    const secretKeyArray = JSON.parse(WALLET_SECRET);
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    
    // Create temp wallet file
    const tmpDir = os.tmpdir();
    const tmpWalletPath = path.join(tmpDir, 'oracle-wallet.json');
    fs.writeFileSync(tmpWalletPath, JSON.stringify(secretKeyArray));
    
    // Initialize SDK with wallet
    sdk = new OptimisticOracleSDK('devnet', tmpWalletPath);
    console.log('💼 Wallet loaded:', sdk.getWalletAddress());
    
    // Clean up temp file
    fs.unlinkSync(tmpWalletPath);
  } catch (error) {
    console.error('⚠️  Error loading wallet:', error);
    sdk = new OptimisticOracleSDK('devnet');
    console.log('⚠️  Using random wallet (no SOL):', sdk.getWalletAddress());
  }
} else {
  sdk = new OptimisticOracleSDK('devnet');
  console.log('⚠️  Using random wallet (no SOL):', sdk.getWalletAddress());
}

// GET / - API Homepage with branding
app.get('/', (req: Request, res: Response) => {
  const hostUrl = req.get('host')?.includes('localhost') 
    ? `http://${req.get('host')}`
    : `https://${req.get('host')}`;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Optimistic Oracle API</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          min-height: 100vh;
          padding: 40px 20px;
        }
        .container {
          max-width: 1000px;
          margin: 0 auto;
        }
        .header {
          background: linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%);
          padding: 40px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 8px 30px rgba(20, 184, 166, 0.3);
          margin-bottom: 40px;
        }
        .header h1 {
          color: white;
          font-size: 48px;
          margin-bottom: 10px;
          letter-spacing: 2px;
        }
        .tagline {
          color: rgba(255, 255, 255, 0.95);
          font-size: 20px;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .status {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        .status-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #E5E7EB;
        }
        .status-row:last-child {
          border-bottom: none;
        }
        .status-label {
          color: #64748B;
          font-weight: 600;
        }
        .status-value {
          color: #14B8A6;
          font-weight: 700;
        }
        .endpoints {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        .endpoints h2 {
          color: #14B8A6;
          font-size: 28px;
          margin-bottom: 20px;
          border-bottom: 3px solid #14B8A6;
          padding-bottom: 10px;
        }
        .endpoint {
          background: #F8FAFC;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 15px;
          border-left: 4px solid #14B8A6;
          transition: transform 0.2s;
        }
        .endpoint:hover {
          transform: translateX(5px);
        }
        .endpoint-method {
          display: inline-block;
          padding: 4px 12px;
          background: #14B8A6;
          color: white;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
          margin-right: 10px;
        }
        .endpoint-path {
          color: #0F172A;
          font-weight: 600;
          font-size: 18px;
          font-family: 'Courier New', monospace;
        }
        .endpoint-desc {
          color: #64748B;
          margin-top: 8px;
          font-size: 14px;
        }
        .endpoint-example {
          background: #0F172A;
          color: #5EEAD4;
          padding: 12px;
          border-radius: 6px;
          margin-top: 10px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          overflow-x: auto;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          color: #64748B;
          font-size: 14px;
        }
        .footer a {
          color: #14B8A6;
          text-decoration: none;
          font-weight: 600;
        }
        .footer a:hover {
          text-decoration: underline;
        }
        .warning {
          background: #FEF3C7;
          border-left: 4px solid #FBBF24;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          color: #92400E;
        }
        .warning strong {
          color: #B45309;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>OPTIMISTIC ORACLE</h1>
          <div class="tagline">Truth by Default, Verified by Economics</div>
        </div>

        <div class="warning">
          <strong>⚠️ Testnet Only</strong> - This API is running on Solana Devnet. Do not use in production.
        </div>

        <div class="status">
          <div class="status-row">
            <span class="status-label">Status</span>
            <span class="status-value">🟢 Online</span>
          </div>
          <div class="status-row">
            <span class="status-label">Network</span>
            <span class="status-value">Solana Devnet</span>
          </div>
          <div class="status-row">
            <span class="status-label">Program ID</span>
            <span class="status-value">4qdXVo...dgkFU</span>
          </div>
          <div class="status-row">
            <span class="status-label">Version</span>
            <span class="status-value">v0.1.0-alpha</span>
          </div>
        </div>

        <div class="endpoints">
          <h2>📡 API Endpoints</h2>

          <div class="endpoint">
            <span class="endpoint-method">GET</span>
            <span class="endpoint-path">/api/health</span>
            <div class="endpoint-desc">Health check endpoint</div>
            <div class="endpoint-example">curl ${hostUrl}/api/health</div>
          </div>

          <div class="endpoint">
            <span class="endpoint-method">GET</span>
            <span class="endpoint-path">/api/stats</span>
            <div class="endpoint-desc">Get oracle statistics</div>
            <div class="endpoint-example">curl ${hostUrl}/api/stats</div>
          </div>

          <div class="endpoint">
            <span class="endpoint-method">GET</span>
            <span class="endpoint-path">/api/requests</span>
            <div class="endpoint-desc">Get all oracle requests</div>
            <div class="endpoint-example">curl ${hostUrl}/api/requests</div>
          </div>

          <div class="endpoint">
            <span class="endpoint-method">GET</span>
            <span class="endpoint-path">/api/requests/:id</span>
            <div class="endpoint-desc">Get specific request by ID</div>
            <div class="endpoint-example">curl ${hostUrl}/api/requests/1</div>
          </div>

          <div class="endpoint">
            <span class="endpoint-method">POST</span>
            <span class="endpoint-path">/api/requests</span>
            <div class="endpoint-desc">Create new oracle request</div>
            <div class="endpoint-example">curl -X POST ${hostUrl}/api/requests \\
  -H "Content-Type: application/json" \\
  -d '{"question":"Will BTC reach 100k?","expiryMinutes":60,"rewardSOL":0.1,"bondSOL":0.05,"challengeHours":1}'</div>
          </div>

          <div class="endpoint">
            <span class="endpoint-method">POST</span>
            <span class="endpoint-path">/api/requests/:id/propose</span>
            <div class="endpoint-desc">Propose answer to request</div>
            <div class="endpoint-example">curl -X POST ${hostUrl}/api/requests/1/propose \\
  -H "Content-Type: application/json" \\
  -d '{"answer":"YES"}'</div>
          </div>
        </div>

        <div class="footer">
          <p><strong>Optimistic Oracle API</strong> - Fast, Cheap, Secure, Open</p>
          <p>Built on Solana • Open Source (MIT) • <a href="https://github.com" target="_blank">GitHub</a></p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// GET /api/health - Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    network: 'devnet',
    environment: NODE_ENV
  });
});

// GET /api/stats - Get oracle statistics
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const allRequests = await sdk.getAllRequests();
    
    const stats = {
      totalRequests: allRequests.length,
      activeRequests: allRequests.filter(r => 
        r.status.toLowerCase() === 'created' || 
        r.status.toLowerCase() === 'proposed'
      ).length,
      resolvedRequests: allRequests.filter(r => 
        r.status.toLowerCase() === 'resolved'
      ).length,
      totalValueLocked: allRequests.reduce((sum, r) => 
        sum + r.reward + r.bond, 0
      )
    };

    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/requests - Get all requests
app.get('/api/requests', async (req: Request, res: Response) => {
  try {
    const requests = await sdk.getAllRequests();
    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/requests/:id - Get specific request
app.get('/api/requests/:id', async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const request = await sdk.getRequest(requestId);
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        error: 'Request not found' 
      });
    }

    res.json({ success: true, data: request });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/requests - Create new request
app.post('/api/requests', async (req: Request, res: Response) => {
  try {
    const { question, expiryMinutes, rewardSOL, bondSOL, challengeHours, dataSource } = req.body;

    // Validate inputs
    if (!question || !expiryMinutes || !rewardSOL || !bondSOL || !challengeHours) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    console.log('📝 Creating request:', { question, expiryMinutes, rewardSOL, bondSOL, challengeHours });

    // ACTUALLY CREATE REQUEST!
    const result = await sdk.createRequest(
      question,
      expiryMinutes,
      rewardSOL,
      bondSOL,
      challengeHours,
      dataSource || ''
    );

    console.log('✅ Request created successfully:', result);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('❌ Error creating request:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create request'
    });
  }
});

// POST /api/requests/:id/propose - Propose answer
app.post('/api/requests/:id/propose', async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const { answer } = req.body;

    // Note: This requires wallet setup in SDK
    res.json({
      success: true,
      message: 'Propose answer endpoint (requires wallet setup)',
      requestId,
      answer
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Optimistic Oracle API`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`🔗 API Endpoint: ${BASE_URL}/api`);
  console.log(`📊 Health Check: ${BASE_URL}/api/health`);
  console.log(`📈 Statistics: ${BASE_URL}/api/stats`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

export default app;
