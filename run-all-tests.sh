#!/bin/bash

echo "🧪 Running All Tests for Restaurant POS System"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track test results
BACKEND_RESULT=0
FRONTEND_RESULT=0
E2E_RESULT=0

# Backend Tests
echo -e "${YELLOW}📦 Running Backend Tests...${NC}"
echo "-------------------------------------------"
cd backend
npm test
BACKEND_RESULT=$?
cd ..

if [ $BACKEND_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Backend tests passed!${NC}"
else
    echo -e "${RED}❌ Backend tests failed!${NC}"
fi
echo ""

# Frontend Tests
echo -e "${YELLOW}⚛️  Running Frontend Tests...${NC}"
echo "-------------------------------------------"
cd frontend
npm test
FRONTEND_RESULT=$?
cd ..

if [ $FRONTEND_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend tests passed!${NC}"
else
    echo -e "${RED}❌ Frontend tests failed!${NC}"
fi
echo ""

# E2E Tests (optional - requires running servers)
read -p "Run E2E tests? (requires running servers) [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🎭 Running E2E Tests...${NC}"
    echo "-------------------------------------------"
    cd e2e
    npm test
    E2E_RESULT=$?
    cd ..

    if [ $E2E_RESULT -eq 0 ]; then
        echo -e "${GREEN}✅ E2E tests passed!${NC}"
    else
        echo -e "${RED}❌ E2E tests failed!${NC}"
    fi
    echo ""
fi

# Summary
echo ""
echo "=============================================="
echo "📊 Test Summary"
echo "=============================================="
echo ""

if [ $BACKEND_RESULT -eq 0 ]; then
    echo -e "Backend:  ${GREEN}✅ PASSED${NC}"
else
    echo -e "Backend:  ${RED}❌ FAILED${NC}"
fi

if [ $FRONTEND_RESULT -eq 0 ]; then
    echo -e "Frontend: ${GREEN}✅ PASSED${NC}"
else
    echo -e "Frontend: ${RED}❌ FAILED${NC}"
fi

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ $E2E_RESULT -eq 0 ]; then
        echo -e "E2E:      ${GREEN}✅ PASSED${NC}"
    else
        echo -e "E2E:      ${RED}❌ FAILED${NC}"
    fi
fi

echo ""
echo "=============================================="

# Exit with error if any tests failed
if [ $BACKEND_RESULT -ne 0 ] || [ $FRONTEND_RESULT -ne 0 ] || [ $E2E_RESULT -ne 0 ]; then
    exit 1
fi

exit 0
