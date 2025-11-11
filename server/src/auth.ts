import { Request, Response, NextFunction } from 'express';
import { db } from './database';
import { Device } from './types';

export interface AuthenticatedRequest extends Request {
  device?: Device;
}

export function deviceAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const deviceId = req.header('X-Device-ID');
    const authToken = req.header('X-Device-Auth-Token');

    if (!deviceId || !authToken) {
      return res.status(401).json({
        error: 'Missing device credentials',
        required_headers: ['X-Device-ID', 'X-Device-Auth-Token']
      });
    }

    const device = db.getDevice(deviceId);
    
    if (!device) {
      return res.status(401).json({
        error: 'Invalid device ID',
        device_id: deviceId
      });
    }

    if (device.auth_token !== authToken) {
      return res.status(401).json({
        error: 'Invalid authentication token',
        device_id: deviceId
      });
    }

    if (device.status === 'offline') {
      return res.status(503).json({
        error: 'Device is offline',
        device_id: deviceId,
        device_status: device.status
      });
    }

    // Update device last seen
    db.updateDevice(deviceId, { 
      status: 'online',
      last_seen: new Date().toISOString() 
    });

    req.device = device;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Internal authentication error'
    });
  }
}

// Middleware for user authentication (for app endpoints)
export function userAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header:', authHeader);
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
        required_format: 'Bearer {token}'
      });
    }

    const token = authHeader.substring(7);
    
    if (!token || token.length < 10) {
      console.log('❌ Invalid token format:', token);
      return res.status(401).json({
        error: 'Invalid token format'
      });
    }

    // Validate demo token format: demo-token-for-{userId}
    if (token.startsWith('demo-token-for-')) {
      const userId = token.replace('demo-token-for-', '');
      console.log(`✅ Authenticated user: ${userId}`);
      
      (req as any).user = {
        id: userId,
        email: 'authenticated-user'
      };
    } else {
      console.log('❌ Invalid token format (not demo token):', token);
      return res.status(401).json({
        error: 'Invalid token format'
      });
    }

    next();
  } catch (error) {
    console.error('User authentication error:', error);
    return res.status(500).json({
      error: 'Internal authentication error'
    });
  }
}

// Optional device type validation
export function requireDeviceType(deviceType: 'carebox' | 'careband') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.device) {
      return res.status(500).json({
        error: 'Device not authenticated'
      });
    }

    if (req.device.type !== deviceType) {
      return res.status(403).json({
        error: `This endpoint requires a ${deviceType} device`,
        your_device_type: req.device.type
      });
    }

    next();
  };
}

// API Key authentication middleware
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header for API key:', authHeader);
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
        required_format: 'Bearer {your-api-key}'
      });
    }

    const apiKey = authHeader.substring(7);
    
    if (!apiKey || apiKey.length < 10) {
      console.log('❌ Invalid API key format:', apiKey);
      return res.status(401).json({
        error: 'Invalid API key format'
      });
    }

    // Validate API key against database
    if (!db.isApiKeyValid(apiKey)) {
      console.log('❌ Invalid or expired API key');
      return res.status(401).json({
        error: 'Invalid or expired API key'
      });
    }

    console.log(`✅ API key authenticated successfully`);
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      error: 'Internal authentication error'
    });
  }
}