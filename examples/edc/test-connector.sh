#!/bin/bash
echo "=== Testing stbx-consumer EDC Connector ==="
echo "Target: 51.158.102.51"
echo ""

# Test connectivity
echo "1. Testing VM connectivity..."
ping -c 1 51.158.102.51 > /dev/null 2>&1 && echo "✅ VM reachable" || echo "❌ VM unreachable"

# Test all EDC ports
echo "2. Testing EDC ports..."
for port in 29191 29192 29193 29194 29195 29291; do
    echo -n "Port $port: "
    timeout 3 bash -c "echo >/dev/tcp/51.158.102.51/$port" 2>/dev/null && echo "✅ Open" || echo "❌ Closed"
done

# Test HTTP endpoints
echo "3. Testing HTTP endpoints..."
echo "Main API (29191):"
curl -I http://51.158.102.51:29191/api 2>/dev/null | head -1

echo "Management API (29193):"
curl -I http://51.158.102.51:29193/management 2>/dev/null | head -1

echo "Protocol API (29194):"  
curl -I http://51.158.102.51:29194/protocol 2>/dev/null | head -1

echo "Public API (29291):"
curl -I http://51.158.102.51:29291/public 2>/dev/null | head -1

echo "Control API (29192):"
curl -I http://51.158.102.51:29192/control 2>/dev/null | head -1

echo "Version API (29195):"
curl -I http://51.158.102.51:29195/version 2>/dev/null | head -1

# Test authentication on management endpoints
echo "4. Testing authentication..."
echo "Assets endpoint:"
curl -s -o /dev/null -w "HTTP %{http_code}" http://51.158.102.51:29193/management/v3/assets
echo ""

echo "Policies endpoint:"
curl -s -o /dev/null -w "HTTP %{http_code}" http://51.158.102.51:29193/management/v3/policies
echo ""