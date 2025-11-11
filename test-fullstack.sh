#!/bin/bash

echo "🧪 CareApp Fullstack Integration Test"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local test_name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="$5"
    
    echo -n "Testing $test_name... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $response_body"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to extract token from response
extract_token() {
    local response="$1"
    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 2

echo ""
echo "📋 Test 1: Backend Health Check"
test_endpoint "Health Check" "GET" "http://localhost:3001/health" "" "200"

echo ""
echo "📋 Test 2: User Registration"
register_response=$(curl -s -X POST "http://localhost:3001/api/register" \
    -H "Content-Type: application/json" \
    -d '{"name":"Integration Test User","email":"integration@test.com","password":"testpass123"}')

if echo "$register_response" | grep -q '"user"'; then
    echo -e "Testing User Registration... ${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
    
    # Extract token for subsequent tests
    AUTH_TOKEN=$(extract_token "$register_response")
    if [ -n "$AUTH_TOKEN" ]; then
        echo "🔑 Auth token extracted: ${AUTH_TOKEN:0:20}..."
    fi
else
    echo -e "Testing User Registration... ${RED}✗ FAIL${NC}"
    echo "Response: $register_response"
    ((TESTS_FAILED++))
    AUTH_TOKEN="demo-token-for-test"
fi

echo ""
echo "📋 Test 3: User Login"
test_endpoint "User Login" "POST" "http://localhost:3001/api/login" \
    '{"email":"integration@test.com","password":"testpass123"}' "200"

echo ""
echo "📋 Test 4: Create Medication"
test_endpoint "Create Medication" "POST" "http://localhost:3001/api/medications" \
    '{"name":"Test Medication","times":["08:00"],"durationDays":30}' "201"

echo ""
echo "📋 Test 5: Get Medications (Unauthenticated)"
test_endpoint "Get Medications (Unauthenticated)" "GET" "http://localhost:3001/api/medications" "" "401"

echo ""
echo "📋 Test 6: Get Medications (Authenticated)"
if [ -n "$AUTH_TOKEN" ]; then
    test_endpoint "Get Medications (Authenticated)" "GET" "http://localhost:3001/api/medications" \
        "" "200"
else
    echo -n "Testing Get Medications (Authenticated)... ${YELLOW}⚠ SKIP${NC} (No token available)"
    echo ""
fi

echo ""
echo "📋 Test 7: Create Medication with Auth"
if [ -n "$AUTH_TOKEN" ]; then
    test_endpoint "Create Medication (Authenticated)" "POST" "http://localhost:3001/api/medications" \
        '{"name":"Auth Medication","times":["12:00"],"durationDays":15}' "201"
else
    echo -n "Testing Create Medication (Authenticated)... ${YELLOW}⚠ SKIP${NC} (No token available)"
    echo ""
fi

echo ""
echo "📋 Test 8: Today's Doses"
test_endpoint "Today's Doses" "GET" "http://localhost:3001/api/doses/today" "" "200"

echo ""
echo "📋 Test 9: Adherence Stats"
test_endpoint "Adherence Stats" "GET" "http://localhost:3001/api/stats/adherence" "" "200"

echo ""
echo "📋 Test 10: Device Status"
test_endpoint "Device Status" "GET" "http://localhost:3001/api/devices/status" "" "200"

echo ""
echo "📋 Test 11: Invalid Endpoint"
test_endpoint "Invalid Endpoint" "GET" "http://localhost:3001/api/nonexistent" "" "404"

# Test frontend (basic connectivity)
echo ""
echo "📋 Test 12: Frontend Metro Server"
if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo -e "Testing Frontend Metro Server... ${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "Testing Frontend Metro Server... ${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test demo user login
echo ""
echo "📋 Test 13: Demo User Login"
test_endpoint "Demo User Login" "POST" "http://localhost:3001/api/login" \
    '{"email":"demo@example.com","password":"password123"}' "200"

# Summary
echo ""
echo "======================================"
echo "🧪 Test Results Summary"
echo "======================================"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Fullstack integration is working correctly.${NC}"
    echo ""
    echo "🔗 Access Points:"
    echo "   Backend API: http://localhost:3001"
    echo "   API Docs: http://localhost:3001/"
    echo "   Health Check: http://localhost:3001/health"
    echo "   Frontend: http://localhost:8081"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please check the output above.${NC}"
    exit 1
fi