#!/bin/bash
echo "=== EDC v3 Endpoint Verification ==="
echo "Target: 51.158.102.51:29193 (stbx-consumer)"
echo ""

# Test v3 specific endpoints
echo "2. v3 Assets endpoint:"
curl -X POST -I http://51.158.102.51:29193/management/v3/assets

echo "3. v3 Policy definitions:"
curl -X POST -I http://51.158.102.51:29193/management/v3/policydefinitions

echo "4. v3 Contract definitions:"
curl -I http://51.158.102.51:29193/management/v3/contractdefinitions

echo "5. v3 Catalog request:"
curl -I http://51.158.102.51:29193/management/v3/catalog/request

echo "6. v3 Contract negotiations:"
curl -I http://51.158.102.51:29193/management/v3/contractnegotiations

echo "7. v3 Transfer processes:"
curl -I http://51.158.102.51:29193/management/v3/transferprocesses

echo ""
echo "Expected: HTTP 401 (needs authentication) or HTTP 200/404"
echo "If you see HTTP 401, the endpoints exist and need authentication ✅"