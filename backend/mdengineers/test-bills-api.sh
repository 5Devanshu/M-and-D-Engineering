#!/bin/bash

# ============================================================================
# Bills Module - Backend API Testing Script
# Purpose: Automated testing of Bills API endpoints
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:8000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
TEST_RESULTS_FILE="bills-test-results.json"

# Global variables
TOKEN=""
BILL_ID=""
TEST_PASS=0
TEST_FAIL=0

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
  echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"
}

print_test() {
  echo -e "${YELLOW}➜ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
  ((TEST_PASS++))
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
  ((TEST_FAIL++))
}

print_info() {
  echo -e "${BLUE}ℹ  $1${NC}"
}

print_response() {
  echo -e "${YELLOW}Response:${NC}"
  echo "$1" | jq '.' 2>/dev/null || echo "$1"
  echo ""
}

# Check if jq is installed
check_dependencies() {
  print_header "Checking Dependencies"
  
  if ! command -v curl &> /dev/null; then
    print_error "curl not found. Please install curl."
    exit 1
  fi
  print_success "curl is installed"
  
  if ! command -v jq &> /dev/null; then
    print_info "jq not found. Install for better JSON formatting: brew install jq"
  else
    print_success "jq is installed"
  fi
}

# Check API health
check_api_health() {
  print_header "Checking API Health"
  
  print_test "Connecting to $API_URL"
  
  HEALTH=$(curl -s -w "\n%{http_code}" "$API_URL/health")
  HTTP_CODE=$(echo "$HEALTH" | tail -1)
  BODY=$(echo "$HEALTH" | head -1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    print_success "API is running"
    print_response "$BODY"
  else
    print_error "API is not responding (HTTP $HTTP_CODE)"
    exit 1
  fi
}

# ============================================================================
# Authentication Tests
# ============================================================================

test_login() {
  print_header "Test 1: User Authentication"
  
  print_test "Logging in with email: $ADMIN_EMAIL"
  
  LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$ADMIN_EMAIL\",
      \"password\": \"$ADMIN_PASSWORD\"
    }")
  
  HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -1)
  BODY=$(echo "$LOGIN_RESPONSE" | head -1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    TOKEN=$(echo "$BODY" | jq -r '.data.token' 2>/dev/null || echo "")
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
      print_success "Login successful"
      print_info "Token: ${TOKEN:0:20}..."
      print_response "$BODY"
      return 0
    else
      print_error "Login response missing token"
      print_response "$BODY"
      return 1
    fi
  else
    print_error "Login failed (HTTP $HTTP_CODE)"
    print_response "$BODY"
    return 1
  fi
}

# ============================================================================
# Bills CRUD Tests
# ============================================================================

test_create_bill() {
  print_header "Test 2: Create Bill"
  
  if [ -z "$TOKEN" ]; then
    print_error "No authentication token. Run login test first."
    return 1
  fi
  
  print_test "Creating a new bill"
  
  CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/bills" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "customer_id": 1,
      "items": [
        {
          "particular_id": 1,
          "quantity": 10,
          "rate": 500.00
        },
        {
          "particular_id": 2,
          "quantity": 5,
          "rate": 250.00
        }
      ],
      "total_amount": 6250,
      "description": "Test Bill",
      "due_date": "2025-12-31",
      "notes": "Automated test bill"
    }')
  
  HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -1)
  BODY=$(echo "$CREATE_RESPONSE" | head -1)
  
  if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    BILL_ID=$(echo "$BODY" | jq -r '.data.bill.id' 2>/dev/null || echo "")
    
    if [ -n "$BILL_ID" ] && [ "$BILL_ID" != "null" ]; then
      print_success "Bill created successfully"
      print_info "Bill ID: $BILL_ID"
      print_response "$BODY"
      return 0
    else
      print_error "Bill creation response missing ID"
      print_response "$BODY"
      return 1
    fi
  else
    print_error "Bill creation failed (HTTP $HTTP_CODE)"
    print_response "$BODY"
    return 1
  fi
}

test_get_bills() {
  print_header "Test 3: Get All Bills"
  
  if [ -z "$TOKEN" ]; then
    print_error "No authentication token."
    return 1
  fi
  
  print_test "Fetching all bills with pagination"
  
  GET_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/bills?limit=10&offset=0" \
    -H "Authorization: Bearer $TOKEN")
  
  HTTP_CODE=$(echo "$GET_RESPONSE" | tail -1)
  BODY=$(echo "$GET_RESPONSE" | head -1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    COUNT=$(echo "$BODY" | jq '.data.bills | length' 2>/dev/null || echo "?")
    print_success "Bills retrieved successfully"
    print_info "Bills count: $COUNT"
    print_response "$BODY"
    return 0
  else
    print_error "Failed to fetch bills (HTTP $HTTP_CODE)"
    print_response "$BODY"
    return 1
  fi
}

test_get_bill_by_id() {
  print_header "Test 4: Get Bill by ID"
  
  if [ -z "$TOKEN" ] || [ -z "$BILL_ID" ]; then
    print_error "Missing token or bill ID. Create a bill first."
    return 1
  fi
  
  print_test "Fetching bill with ID: $BILL_ID"
  
  GET_ID_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/bills/$BILL_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  HTTP_CODE=$(echo "$GET_ID_RESPONSE" | tail -1)
  BODY=$(echo "$GET_ID_RESPONSE" | head -1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    print_success "Bill retrieved by ID successfully"
    print_response "$BODY"
    return 0
  else
    print_error "Failed to fetch bill by ID (HTTP $HTTP_CODE)"
    print_response "$BODY"
    return 1
  fi
}

test_update_bill() {
  print_header "Test 5: Update Bill"
  
  if [ -z "$TOKEN" ] || [ -z "$BILL_ID" ]; then
    print_error "Missing token or bill ID."
    return 1
  fi
  
  print_test "Updating bill with ID: $BILL_ID"
  
  UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/api/bills/$BILL_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "customer_id": 1,
      "items": [
        {
          "particular_id": 1,
          "quantity": 15,
          "rate": 500.00
        }
      ],
      "total_amount": 8875
    }')
  
  HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -1)
  BODY=$(echo "$UPDATE_RESPONSE" | head -1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    print_success "Bill updated successfully"
    print_response "$BODY"
    return 0
  else
    print_error "Bill update failed (HTTP $HTTP_CODE)"
    print_response "$BODY"
    return 1
  fi
}

# ============================================================================
# BMS Integration Tests
# ============================================================================

test_send_bill() {
  print_header "Test 6: Send Bill to BMS"
  
  if [ -z "$TOKEN" ] || [ -z "$BILL_ID" ]; then
    print_error "Missing token or bill ID."
    return 1
  fi
  
  print_test "Sending bill to BMS (Bill ID: $BILL_ID)"
  
  SEND_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/bills/$BILL_ID/send" \
    -H "Authorization: Bearer $TOKEN")
  
  HTTP_CODE=$(echo "$SEND_RESPONSE" | tail -1)
  BODY=$(echo "$SEND_RESPONSE" | head -1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    BMS_ID=$(echo "$BODY" | jq -r '.data.bill.bms_invoice_id' 2>/dev/null || echo "")
    print_success "Bill sent to BMS successfully"
    print_info "BMS Invoice ID: $BMS_ID"
    print_response "$BODY"
    return 0
  else
    print_error "Failed to send bill to BMS (HTTP $HTTP_CODE)"
    print_info "This may be expected if BMS service is not configured"
    print_response "$BODY"
    return 1
  fi
}

# ============================================================================
# Data Validation Tests
# ============================================================================

test_validation_missing_customer() {
  print_header "Test 7: Validation - Missing Customer ID"
  
  if [ -z "$TOKEN" ]; then
    print_error "No authentication token."
    return 1
  fi
  
  print_test "Creating bill without customer_id (should fail)"
  
  INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/bills" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "items": [{ "particular_id": 1, "quantity": 10, "rate": 500.00 }],
      "total_amount": 5000
    }')
  
  HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -1)
  BODY=$(echo "$INVALID_RESPONSE" | head -1)
  
  if [ "$HTTP_CODE" != "201" ] && [ "$HTTP_CODE" != "200" ]; then
    print_success "Validation correctly rejected request"
    print_response "$BODY"
    return 0
  else
    print_error "Validation should have rejected request"
    print_response "$BODY"
    return 1
  fi
}

test_validation_missing_items() {
  print_header "Test 8: Validation - Missing Items"
  
  if [ -z "$TOKEN" ]; then
    print_error "No authentication token."
    return 1
  fi
  
  print_test "Creating bill without items (should fail)"
  
  INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/bills" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "customer_id": 1,
      "items": [],
      "total_amount": 0
    }')
  
  HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -1)
  BODY=$(echo "$INVALID_RESPONSE" | head -1)
  
  if [ "$HTTP_CODE" != "201" ] && [ "$HTTP_CODE" != "200" ]; then
    print_success "Validation correctly rejected request"
    print_response "$BODY"
    return 0
  else
    print_error "Validation should have rejected request"
    print_response "$BODY"
    return 1
  fi
}

# ============================================================================
# Main Test Execution
# ============================================================================

main() {
  print_header "🧪 Bills Module - Backend API Testing Suite"
  
  echo "API URL: $API_URL"
  echo "Test started at: $(date)"
  echo ""
  
  # Run tests
  check_dependencies
  check_api_health
  test_login && test_create_bill && test_get_bills && test_get_bill_by_id && \
    test_update_bill && test_send_bill && test_validation_missing_customer && \
    test_validation_missing_items
  
  # Print summary
  print_header "Test Summary"
  TOTAL=$((TEST_PASS + TEST_FAIL))
  echo "Total Tests: $TOTAL"
  echo -e "${GREEN}Passed: $TEST_PASS${NC}"
  echo -e "${RED}Failed: $TEST_FAIL${NC}"
  echo "Test completed at: $(date)"
  
  # Save results to file
  {
    echo "{"
    echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
    echo "  \"api_url\": \"$API_URL\","
    echo "  \"total_tests\": $TOTAL,"
    echo "  \"passed\": $TEST_PASS,"
    echo "  \"failed\": $TEST_FAIL,"
    echo "  \"success_rate\": \"$((TEST_PASS * 100 / TOTAL))%\""
    echo "}"
  } > "$TEST_RESULTS_FILE"
  
  print_info "Results saved to: $TEST_RESULTS_FILE"
  
  if [ $TEST_FAIL -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed!${NC}\n"
    exit 0
  else
    echo -e "\n${RED}⚠️  Some tests failed. Check output above.${NC}\n"
    exit 1
  fi
}

# ============================================================================
# Script Entry Point
# ============================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --api-url)
      API_URL="$2"
      shift 2
      ;;
    --email)
      ADMIN_EMAIL="$2"
      shift 2
      ;;
    --password)
      ADMIN_PASSWORD="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --api-url URL          API base URL (default: http://localhost:8000)"
      echo "  --email EMAIL          Admin email (default: admin@example.com)"
      echo "  --password PASSWORD    Admin password (default: admin123)"
      echo "  --help                 Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Execute main function
main
