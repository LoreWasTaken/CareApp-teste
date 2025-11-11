import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { db } from './database';
import { stateMachine } from './state-machine';
import deviceRoutes from './device-routes';
import appRoutes from './app-routes';
import testRoutes from './test-routes';
import { requestLogger, errorLogger } from './logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Add comprehensive request/response logging
app.use(requestLogger);

// Error logging middleware
app.use(errorLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/devices', deviceRoutes);
app.use('/api', appRoutes);
app.use('/api/test', testRoutes);

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'CareApp Server API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      'Health Check': 'GET /health',
      'Device Events': {
        'CareBox Events': 'POST /api/devices/carebox/event',
        'CareBand Events': 'POST /api/devices/careband/event'
      },
      'App Queries': {
        'Today Schedule': 'GET /api/doses/today',
        'Upcoming Doses': 'GET /api/doses/upcoming?hours=4',
        'Adherence Stats': 'GET /api/stats/adherence?days=7',
        'Weekly Stats': 'GET /api/stats/weekly',
        'Calendar View': 'GET /api/stats/calendar?month=11&year=2025',
        'Device Status': 'GET /api/devices/status',
        'Inventory': 'GET /api/devices/inventory',
        'Dose History': 'GET /api/history/doses?days=30&status=missed'
      },
      'Health & Symptoms': {
        'Log Symptom': 'POST /api/health/log-symptom',
        'Get Symptoms': 'GET /api/health/symptoms',
        'Symptom Correlations': 'GET /api/health/symptom-correlations'
      },
      'Doctor Reports': {
        'Generate Report': 'GET /api/reports/doctor-visit?range=90days'
      },
      'Caregiver Portal': {
        'Add Caregiver': 'POST /api/caregivers/add',
        'Caregiver Dashboard': 'GET /api/caregivers/dashboard',
        'Alert Rules': 'POST /api/caregivers/alert-rules',
        'Get Alert Rules': 'GET /api/caregivers/alert-rules'
      },
      'Testing': {
        'Test Scenarios': 'GET /api/test/scenarios',
        'Simulate Dispense': 'POST /api/test/simulate-dispense',
        'Simulate Retrieval': 'POST /api/test/simulate-retrieval',
        'Simulate Error': 'POST /api/test/simulate-error',
        'Simulate Timeout': 'POST /api/test/simulate-timeout',
        'Simulate Band Alert': 'POST /api/test/simulate-band-alert',
        'Simulate Band Button': 'POST /api/test/simulate-band-button'
      }
    },
    authentication: {
      'Device Auth': 'X-Device-ID and X-Device-Auth-Token headers',
      'User Auth': 'Bearer token in Authorization header'
    },
    documentation: 'See README.md for detailed API documentation'
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message || 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 CareApp Server running on port ${PORT}`);
  console.log(`📱 API Documentation: http://localhost:${PORT}`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test Scenarios: http://localhost:${PORT}/api/test/scenarios`);
  console.log('\n📋 Available Endpoints:');
  console.log('   Device Events: POST /api/devices/carebox/event, POST /api/devices/careband/event');
  console.log('   App Queries: GET /api/doses/today, GET /api/stats/adherence, etc.');
  console.log('   Testing: POST /api/test/simulate-dispense, POST /api/test/simulate-retrieval, etc.');
  console.log('\n🔐 Authentication Required:');
  console.log('   Devices: X-Device-ID and X-Device-Auth-Token headers');
  console.log('   App: Bearer token in Authorization header');
  
  // Start the state machine timeout service
  stateMachine.startTimeoutService();
  console.log('\n⏰ State machine timeout service started');
  
  // Start API key cleanup service (runs daily at midnight)
  const startApiKeyCleanupService = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Next midnight
    const msUntilMidnight = midnight.getTime() - now.getTime();
    
    setTimeout(() => {
      console.log('\n🧹 Running daily API key cleanup...');
      const cleanedCount = db.cleanupExpiredApiKeys();
      console.log(`✅ Cleaned up ${cleanedCount} expired API keys`);
      
      // Schedule next cleanup
      startApiKeyCleanupService();
    }, msUntilMidnight);
    
    console.log(`⏰ API key cleanup service scheduled for midnight (${msUntilMidnight}ms from now)`);
  };
  
  startApiKeyCleanupService();
  
  // Initialize database with sample data
  console.log('\n💊 Sample data initialized:');
  console.log(`   Medications: ${db.getAllMedications().length}`);
  console.log(`   Devices: ${db.getAllDevices().length}`);
  console.log(`   Today's Doses: ${db.getTodayDoses().length}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('💤 Server closed');
    stateMachine.stopTimeoutService();
    console.log('⏰ State machine service stopped');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('💤 Server closed');
    stateMachine.stopTimeoutService();
    console.log('⏰ State machine service stopped');
    process.exit(0);
  });
});

export default app;