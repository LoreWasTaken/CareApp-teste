import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extended Request interface to include request ID
interface LoggedRequest extends Request {
  requestId?: string;
  startTime?: number;
}

export function requestLogger(req: LoggedRequest, res: Response, next: NextFunction) {
  // Generate unique request ID
  const requestId = randomUUID();
  req.requestId = requestId;
  req.startTime = Date.now();
  
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const authHeader = req.get('Authorization');
  const deviceId = req.get('X-Device-ID');
  const deviceAuthToken = req.get('X-Device-Auth-Token');
  
  // Log request details
  console.log(`\n🌐 [${timestamp}] === HTTP REQUEST START ===`);
  console.log(`🆔 Request ID: ${requestId}`);
  console.log(`📡 ${method} ${url}`);
  console.log(`🌍 IP: ${ip}`);
  console.log(`🔍 User-Agent: ${userAgent.substring(0, 100)}...`);
  
  if (authHeader) {
    console.log(`🔐 Authorization: ${authHeader.substring(0, 20)}...`);
  }
  
  if (deviceId || deviceAuthToken) {
    console.log(`📱 Device Auth:`);
    if (deviceId) console.log(`   - Device ID: ${deviceId}`);
    if (deviceAuthToken) console.log(`   - Auth Token: ${deviceAuthToken.substring(0, 20)}...`);
  }
  
  // Log request headers (filtered for sensitive data)
  console.log(`📋 Request Headers:`);
  Object.entries(req.headers).forEach(([key, value]) => {
    if (key.toLowerCase() === 'authorization' || key.toLowerCase() === 'x-device-auth-token') {
      console.log(`   - ${key}: [FILTERED]`);
    } else if (key.toLowerCase() === 'x-device-id') {
      console.log(`   - ${key}: ${value}`);
    } else {
      console.log(`   - ${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
    }
  });
  
  // Log request body for POST/PUT requests
  if (req.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    console.log(`📄 Request Body:`);
    
    // Create a copy of the body to avoid logging sensitive data
    const sanitizedBody = { ...req.body };
    
    // Filter out sensitive fields
    const sensitiveFields = ['password', 'password_hash', 'email', 'auth_token', 'token'];
    sensitiveFields.forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '[FILTERED]';
      }
    });
    
    console.log(JSON.stringify(sanitizedBody, null, 2));
  }
  
  // Log query parameters
  if (Object.keys(req.query).length > 0) {
    console.log(`🔍 Query Parameters:`, JSON.stringify(req.query, null, 2));
  }
  
  // Capture original res.json and res.send to log responses
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  
  const responseLogger = (responseBody: any, method: string) => {
    const duration = Date.now() - (req.startTime || Date.now());
    const statusCode = res.statusCode;
    
    // Determine status icon
    let statusIcon = '✅';
    if (statusCode >= 500) statusIcon = '💥';
    else if (statusCode >= 400) statusIcon = '❌';
    else if (statusCode >= 300) statusIcon = '🔄';
    else if (statusCode >= 200) statusIcon = '✅';
    
    // Log response details
    console.log(`\n${statusIcon} [${timestamp}] === HTTP RESPONSE ===`);
    console.log(`🆔 Request ID: ${requestId}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status: ${statusCode} ${res.statusMessage || ''}`);
    
    // Log response body (truncated for large responses)
    let responseToLog = responseBody;
    const responseString = JSON.stringify(responseBody);
    
    if (responseString && responseString.length > 1000) {
      responseToLog = {
        ...responseBody,
        _truncated: true,
        _original_length: responseString.length,
        _note: 'Response truncated for logging'
      };
    }
    
    console.log(`📦 Response Body:`);
    console.log(JSON.stringify(responseToLog, null, 2));
    console.log(`🌐 [${timestamp}] === HTTP REQUEST COMPLETE ===\n`);
  };
  
  // Override res.json to log response
  res.json = function(body: any) {
    responseLogger(body, 'json');
    return originalJson(body);
  };
  
  // Override res.send to log response
  res.send = function(body: any) {
    try {
      const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
      responseLogger(parsedBody, 'send');
    } catch (error) {
      responseLogger({ message: 'Non-JSON response', length: body?.length }, 'send');
    }
    return originalSend(body);
  };
  
  // Handle errors
  const originalEnd = res.end.bind(res);
  res.end = function(...args: any[]) {
    if (!res.headersSent) {
      const duration = Date.now() - (req.startTime || Date.now());
      console.log(`💥 [${timestamp}] === HTTP ERROR RESPONSE ===`);
      console.log(`🆔 Request ID: ${requestId}`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${res.statusCode} ${res.statusMessage || ''}`);
    }
    return originalEnd(...args);
  };
  
  next();
}

// Error logging middleware
export function errorLogger(err: any, req: LoggedRequest, res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString();
  const requestId = req.requestId || 'unknown';
  
  console.log(`\n💥 [${timestamp}] === ERROR LOGGING ===`);
  console.log(`🆔 Request ID: ${requestId}`);
  console.log(`📍 URL: ${req.method} ${req.originalUrl}`);
  console.log(`❌ Error Type: ${err.constructor.name}`);
  console.log(`📄 Error Message: ${err.message}`);
  console.log(`📋 Error Stack:`);
  console.log(err.stack);
  console.log(`💥 [${timestamp}] === ERROR COMPLETE ===\n`);
  
  next(err);
}