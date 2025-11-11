#!/bin/bash

# CareApp Server Test Script
# This script demonstrates all major functionality of the CareApp server

set -e

# Configuration
SERVER_URL="http://localhost:3000"
AUTH_HEADER="Authorization: Bearer demo_token_123"
CAREBOX_HEADERS="-H X-Device-ID: carebox_abc123 -H X-Device-Auth-Token: carebox_token_123"
CAREBAND_HEADERS="-H X-Device-ID: careband_xyz456 -H X-Device-Auth-Token: careband_token_456"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if server is running
check_server() {
    print_test "Checking if server is running..."
    if curl -s "$SERVER_URL/health" > /dev/null; then
        print_success "Server is running"
    else
        print_error "Server is not running. Please start it with 'npm run dev' in the server directory"
        exit 1
    fi
}

# Test health endpoint
test_health() {
    print_header "Health Check Test"
    print_test "Testing health endpoint..."
    response=$(curl -s "$SERVER_URL/health")
    echo "$response" | jq .
    print_success "Health check completed"
}

# Test API documentation
test_api_docs() {
    print_header "API Documentation Test"
    print_test "Getting API documentation..."
    response=$(curl -s "$SERVER_URL/")
    echo "$response" | jq .
    print_success "API documentation retrieved"
}

# Test app endpoints (require authentication)
test_app_endpoints() {
    print_header "App Endpoints Test"
    
    # Test today's schedule
    print_test "Getting today's dose schedule..."
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/api/doses/today")
    echo "$response" | jq .
    
    # Test upcoming doses
    print_test "Getting upcoming doses..."
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/api/doses/upcoming?hours=4")
    echo "$response" | jq .
    
    # Test adherence stats
    print_test "Getting adherence statistics..."
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/api/stats/adherence?days=7")
    echo "$response" | jq .
    
    # Test weekly stats
    print_test "Getting weekly statistics..."
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/api/stats/weekly")
    echo "$response" | jq .
    
    # Test device status
    print_test "Getting device status..."
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/api/devices/status")
    echo "$response" | jq .
    
    # Test inventory
    print_test "Getting medication inventory..."
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/api/devices/inventory")
    echo "$response" | jq .
    
    print_success "App endpoints test completed"
}

# Test testing/simulation endpoints
test_simulation_endpoints() {
    print_header "Simulation Endpoints Test"
    
    # Get test scenarios
    print_test "Getting available test scenarios..."
    response=$(curl -s "$SERVER_URL/api/test/scenarios")
    echo "$response" | jq .
    
    print_success "Test scenarios retrieved"
}

# Test device events
test_device_events() {
    print_header "Device Events Test"
    
    # Test CareBox event without authentication
    print_test "Testing CareBox event without authentication..."
    if curl -s -X POST "$SERVER_URL/api/devices/carebox/event" \
         -H "Content-Type: application/json" \
         -d '{"event_type": "test"}' | jq -e '.error' > /dev/null; then
        print_success "Authentication required (expected behavior)"
    else
        print_error "Should have required authentication"
    fi
    
    # Test CareBand event without authentication
    print_test "Testing CareBand event without authentication..."
    if curl -s -X POST "$SERVER_URL/api/devices/careband/event" \
         -H "Content-Type: application/json" \
         -d '{"event_type": "test"}' | jq -e '.error' > /dev/null; then
        print_success "Authentication required (expected behavior)"
    else
        print_error "Should have required authentication"
    fi
    
    print_success "Device authentication test completed"
}

# Test complete workflow simulation
test_complete_workflow() {
    print_header "Complete Workflow Simulation"
    
    print_test "Starting complete workflow test..."
    
    # 1. Check initial state
    print_info "1. Checking initial state..."
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/api/doses/today")
    initial_count=$(echo "$response" | jq '.schedule | length')
    print_info "Initial doses scheduled: $initial_count"
    
    # 2. Simulate pill dispensing
    print_info "2. Simulating pill dispensing..."
    curl -s -X POST "$SERVER_URL/api/test/simulate-dispense" \
         -H "Content-Type: application/json" \
         -d '{"medication_id": "med_xyz789", "delay_seconds": 1}' | jq .
    
    # Wait for dispense
    sleep 2
    
    # 3. Check dispensed waiting state
    print_info "3. Checking dispensed waiting state..."
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/api/doses/today")
    echo "$response" | jq '.schedule[] | select(.status == "dispensed_waiting")'
    
    # 4. Simulate pill retrieval
    print_info "4. Simulating pill retrieval..."
    curl -s -X POST "$SERVER_URL/api/test/simulate-retrieval" \
         -H "Content-Type: application/json" \
         -d '{"medication_id": "med_xyz789", "delay_seconds": 1}' | jq .
    
    # Wait for retrieval
    sleep 2
    
    # 5. Check taken state
    print_info "5. Checking taken state..."
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/api/doses/today")
    echo "$response" | jq '.schedule[] | select(.status == "taken")'
    
    # 6. Check adherence stats
    print_info "6. Checking updated adherence stats..."
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/api/stats/adherence?days=1")
    echo "$response" | jq .
    
    print_success "Complete workflow test finished"
}

# Test error scenario
test_error_scenario() {
    print_header "Error Scenario Test"
    
    print_test "Testing dispense error scenario..."
    
    # Simulate dispense error
    curl -s -X POST "$SERVER_URL/api/test/simulate-error" \
         -H "Content-Type: application/json" \
         -d '{
           "medication_id": "med_xyz789",
           "error_code": "E102",
           "error_type": "iris_gate_jam",
           "error_message": "Iris aperture failed to open"
         }' | jq .
    
    # Check error status
    sleep 1
    print_info "Checking error status..."
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/api/doses/today")
    echo "$response" | jq '.schedule[] | select(.status == "error")'
    
    print_success "Error scenario test completed"
}

# Test timeout scenario
test_timeout_scenario() {
    print_header "Timeout Scenario Test"
    
    print_test "Testing timeout scenario..."
    
    # Simulate timeout (this creates a dose with old timestamp)
    curl -s -X POST "$SERVER_URL/api/test/simulate-timeout" \
         -H "Content-Type: application/json" \
         -d '{"medication_id": "med_new123"}' | jq .
    
    # Wait for timeout processing
    sleep 3
    
    # Check missed status
    print_info "Checking missed status..."
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/api/doses/today")
    echo "$response" | jq '.schedule[] | select(.status == "missed")'
    
    print_success "Timeout scenario test completed"
}

# Test CareBand simulation
test_careband_simulation() {
    print_header "CareBand Simulation Test"
    
    # Simulate band alert
    print_test "Simulating CareBand alert..."
    curl -s -X POST "$SERVER_URL/api/test/simulate-band-alert" \
         -H "Content-Type: application/json" \
         -d '{"medication_id": "med_xyz789"}' | jq .
    
    # Simulate button press
    print_test "Simulating CareBand button press..."
    curl -s -X POST "$SERVER_URL/api/test/simulate-band-button" \
         -H "Content-Type: application/json" \
         -d '{"medication_id": "med_xyz789"}' | jq .
    
    print_success "CareBand simulation test completed"
}

# Test real device events (simulated)
test_real_device_events() {
    print_header "Real Device Events Test"
    
    print_test "Simulating real CareBox pill dispensed event..."
    curl -s -X POST "$SERVER_URL/api/devices/carebox/event" \
         -H "Content-Type: application/json" \
         $CAREBOX_HEADERS \
         -d '{
           "event_type": "pill_dispensed",
           "device_id": "carebox_abc123",
           "medication_id": "med_xyz789",
           "scheduled_time": "2025-11-04T10:00:00Z",
           "actual_dispense_time": "2025-11-04T10:00:02Z",
           "tray_weight_grams": 0.354,
           "timestamp": "2025-11-04T10:00:02Z"
         }' | jq .
    
    # Simulate low inventory
    print_test "Simulating low inventory alert..."
    curl -s -X POST "$SERVER_URL/api/devices/carebox/event" \
         -H "Content-Type: application/json" \
         $CAREBOX_HEADERS \
         -d '{
           "event_type": "low_inventory",
           "device_id": "carebox_abc123",
           "medication_id": "med_new123",
           "pills_remaining": 3,
           "days_remaining": 1,
           "refill_threshold": 7,
           "timestamp": "2025-11-04T10:00:05Z"
         }' | jq .
    
    # Simulate CareBand alert sent
    print_test "Simulating CareBand alert sent..."
    curl -s -X POST "$SERVER_URL/api/devices/careband/event" \
         -H "Content-Type: application/json" \
         $CAREBAND_HEADERS \
         -d '{
           "event_type": "alert_sent",
           "device_id": "careband_xyz456",
           "alert_type": "vibration_pattern_1",
           "medication_id": "med_xyz789",
           "scheduled_time": "2025-11-04T10:00:00Z",
           "timestamp": "2025-11-04T10:00:10Z"
         }' | jq .
    
    print_success "Real device events test completed"
}

# Main test execution
main() {
    print_header "CareApp Server Test Suite"
    print_info "Starting comprehensive test of CareApp server functionality"
    print_info "Server URL: $SERVER_URL"
    
    check_server
    test_health
    test_api_docs
    test_app_endpoints
    test_simulation_endpoints
    test_device_events
    test_complete_workflow
    test_error_scenario
    test_timeout_scenario
    test_careband_simulation
    test_real_device_events
    
    print_header "Test Suite Completed"
    print_success "All tests completed successfully!"
    print_info "Check the output above for any issues or review the server logs"
    print_info "The server is still running and ready for manual testing"
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_error "jq is required for this script but not installed."
    print_info "Please install jq to run this test script:"
    print_info "  macOS: brew install jq"
    print_info "  Ubuntu: sudo apt-get install jq"
    print_info "  Windows: choco install jq"
    exit 1
fi

# Run the main function
main "$@"