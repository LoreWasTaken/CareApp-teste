# CareApp Server

A comprehensive server implementation for the CareApp ecosystem that handles communication between CareBox, CareBand, and the mobile application.

## 🚀 Features

- **Device Communication**: RESTful API for CareBox and CareBand devices
- **State Machine**: Automatic dose state management with timeout detection
- **Real-time Monitoring**: Polling endpoints for app integration
- **Testing Suite**: Built-in simulation endpoints for development and testing
- **Adherence Tracking**: Comprehensive analytics and reporting
- **Authentication**: Device and user authentication middleware

## 📋 API Overview

### Device Events (CareBox & CareBand)
- `POST /api/devices/carebox/event` - Receive CareBox events
- `POST /api/devices/careband/event` - Receive CareBand events

### App Queries
- `GET /api/doses/today` - Today's medication schedule
- `GET /api/doses/upcoming` - Upcoming doses
- `GET /api/stats/adherence` - Adherence statistics
- `GET /api/stats/weekly` - Weekly summary
- `GET /api/devices/status` - Device status
- `GET /api/devices/inventory` - Medication inventory
- `GET /api/history/doses` - Dose history

### Testing & Simulation
- `GET /api/test/scenarios` - List test scenarios
- `POST /api/test/simulate-dispense` - Simulate pill dispensing
- `POST /api/test/simulate-retrieval` - Simulate pill retrieval
- `POST /api/test/simulate-error` - Simulate dispense error
- `POST /api/test/simulate-timeout` - Simulate timeout scenario
- `POST /api/test/simulate-band-alert` - Simulate CareBand alert
- `POST /api/test/simulate-band-button` - Simulate button press

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Build the Server
```bash
npm run build
```

### 3. Start the Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 4. Test the Server
```bash
# Health check
curl http://localhost:3000/health

# Get test scenarios
curl http://localhost:3000/api/test/scenarios
```

## 🧪 Testing Examples

### Complete Workflow Test

```bash
# 1. Check today's schedule
curl -H "Authorization: Bearer demo_token_123" \
     http://localhost:3000/api/doses/today

# 2. Simulate pill dispensing
curl -X POST http://localhost:3000/api/test/simulate-dispense \
     -H "Content-Type: application/json" \
     -d '{"medication_id": "med_xyz789", "delay_seconds": 2}'

# 3. Wait 5 seconds, then simulate retrieval
sleep 5
curl -X POST http://localhost:3000/api/test/simulate-retrieval \
     -H "Content-Type: application/json" \
     -d '{"medication_id": "med_xyz789", "delay_seconds": 1}'

# 4. Check updated schedule
curl -H "Authorization: Bearer demo_token_123" \
     http://localhost:3000/api/doses/today
```

### Device Authentication Test

```bash
# CareBox event (requires device headers)
curl -X POST http://localhost:3000/api/devices/carebox/event \
     -H "Content-Type: application/json" \
     -H "X-Device-ID: carebox_abc123" \
     -H "X-Device-Auth-Token: carebox_token_123" \
     -d '{
       "event_type": "pill_dispensed",
       "device_id": "carebox_abc123",
       "medication_id": "med_xyz789",
       "scheduled_time": "2025-11-04T09:00:00Z",
       "actual_dispense_time": "2025-11-04T09:00:03Z",
       "tray_weight_grams": 0.354,
       "timestamp": "2025-11-04T09:00:03Z"
     }'
```

### Error Simulation Test

```bash
# Simulate dispense error
curl -X POST http://localhost:3000/api/test/simulate-error \
     -H "Content-Type: application/json" \
     -d '{
       "medication_id": "med_xyz789",
       "error_code": "E102",
       "error_type": "iris_gate_jam",
       "error_message": "Iris aperture failed to open - cartridge may be jammed"
     }'

# Check adherence stats after error
curl -H "Authorization: Bearer demo_token_123" \
     http://localhost:3000/api/stats/adherence?days=1
```

### Timeout Simulation Test

```bash
# Simulate timeout scenario (dose will be marked as missed)
curl -X POST http://localhost:3000/api/test/simulate-timeout \
     -H "Content-Type: application/json" \
     -d '{"medication_id": "med_xyz789"}'

# Wait a moment and check status
sleep 2
curl -H "Authorization: Bearer demo_token_123" \
     http://localhost:3000/api/doses/today
```

## 📊 State Machine

The server implements an automatic state machine for dose management:

```
pending → dispensed_waiting → taken ✓
    ↓           ↓
    ↓       (30 min timeout)
    ↓           ↓
    └────────→ missed ✗

pending → error (dispense fails)
pending → skipped (user skips)
```

### State Transitions

1. **pending** → **dispensed_waiting**: CareBox dispenses pill
2. **dispensed_waiting** → **taken**: Pill retrieved from tray
3. **dispensed_waiting** → **missed**: 30-minute timeout (automatic)
4. **pending** → **error**: Dispense failure
5. **error** → **pending**: Can retry
6. **pending** → **skipped**: User skips dose

## 🔐 Authentication

### Device Authentication
Devices must include:
- `X-Device-ID`: Unique device identifier
- `X-Device-Auth-Token`: Device authentication token

### App Authentication
Apps must include:
- `Authorization: Bearer {token}`: User authentication token

## 📱 Response Formats

### Today's Schedule Response
```json
{
  "schedule": [
    {
      "medication_id": "med_xyz789",
      "medication_name": "Lisinopril 10mg",
      "scheduled_time": "2025-11-04T09:00:00Z",
      "status": "taken",
      "actual_time": "2025-11-04T09:05:23Z",
      "time_elapsed_seconds": 323,
      "countdown_remaining_seconds": 0
    }
  ]
}
```

### Device Status Response
```json
{
  "devices": [
    {
      "device_id": "carebox_abc123",
      "type": "carebox",
      "status": "online",
      "last_seen": "2025-11-04T09:44:45.000Z"
    }
  ]
}
```

## 🏗️ Architecture

### Core Components

1. **Database** (`database.ts`): In-memory data store with sample data
2. **State Machine** (`state-machine.ts`): Dose state management and timeout detection
3. **Authentication** (`auth.ts`): Device and user authentication middleware
4. **Device Routes** (`device-routes.ts`): Endpoint handlers for device events
5. **App Routes** (`app-routes.ts`): Endpoint handlers for app queries
6. **Test Routes** (`test-routes.ts`): Simulation endpoints for testing

### Event Flow

```
CareBox → Event → Server → State Update → App Polling
   ↓
CareBand → Event → Server → State Update → App Polling
   ↓
Server → Timeout Check → Auto-missed → App Polling
```

## 🧪 Available Test Scenarios

1. **Successful Dispense and Take**: Normal workflow
2. **Dispense with Timeout**: Simulates missed doses
3. **Dispense Error**: Mechanical failure scenarios
4. **CareBand Reminder**: Haptic alert simulation
5. **CareBand Acknowledgment**: User interaction simulation

## 📈 Monitoring & Analytics

### Adherence Metrics
- Daily/weekly adherence rates
- Missed dose tracking
- Error rate monitoring
- Medication inventory levels

### Real-time Updates
- Apps should poll `/api/doses/today` every 15 seconds
- Countdown timers update automatically
- Status changes reflected immediately

## 🚨 Error Handling

The server implements comprehensive error handling:
- Input validation for all endpoints
- Authentication failure responses
- Rate limiting (configurable)
- Graceful degradation for service interruptions

## 🔧 Configuration

Environment variables:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode

## 📝 Development

### Build Commands
```bash
npm run dev    # Development with hot reload
npm run build  # Production build
npm start      # Start production server
```

### Adding New Events
1. Define event interface in `types.ts`
2. Add event handler in `device-routes.ts`
3. Update state machine logic if needed
4. Add test scenario in `test-routes.ts`

## 🎯 Production Considerations

For production deployment:
1. Replace in-memory database with persistent storage
2. Implement proper JWT authentication
3. Add rate limiting and request validation
4. Set up monitoring and logging
5. Configure HTTPS and security headers
6. Implement backup and disaster recovery

## 📞 Support

For issues and questions:
1. Check the API documentation at `GET /`
2. Review test scenarios at `GET /api/test/scenarios`
3. Monitor server logs for debugging information
4. Use health check endpoint `GET /health` for status

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-04