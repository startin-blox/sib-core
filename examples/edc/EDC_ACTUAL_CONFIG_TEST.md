# Testing Your Actual EDC Connector Configuration

## Current EDC Configuration Analysis

Based on your configuration, your EDC connector has these endpoints:

```properties
edc.participant.id=stbx-consumer
edc.dsp.callback.address=http://localhost:29194/protocol

# API Endpoints
web.http.port=29191                    # Main API: http://51.158.102.51:29191/api
web.http.management.port=29193         # Management: http://51.158.102.51:29193/management  
web.http.protocol.port=29194           # Protocol: http://51.158.102.51:29194/protocol
web.http.public.port=29291             # Public: http://51.158.102.51:29291/public
web.http.control.port=29192            # Control: http://51.158.102.51:29192/control
web.http.version.port=29195            # Version: http://51.158.102.51:29195/version
```

---

## 🧪 **Immediate Testing Commands**

### 1. Test All Endpoints
```bash
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
curl -s -o /dev/null -w "HTTP %{http_code}" http://51.158.102.51:29193/management/v2/assets
echo ""

echo "Policies endpoint:"
curl -s -o /dev/null -w "HTTP %{http_code}" http://51.158.102.51:29193/management/v2/policies
echo ""
```

### 2. Test Specific Management API Endpoints
```bash
# Test Management API v2 endpoints (what your demo needs)
curl -I http://51.158.102.51:29193/management/v2
curl -I http://51.158.102.51:29193/management/v2/assets
curl -I http://51.158.102.51:29193/management/v2/policies
curl -I http://51.158.102.51:29193/management/v2/contractdefinitions

# Test catalog endpoint specifically
curl -I http://51.158.102.51:29193/management/v2/catalog/request
```

### 3. Test Version and Health Endpoints
```bash
# Version information
curl http://51.158.102.51:29195/version
curl http://51.158.102.51:29195/version/api

# Health checks (if available)
curl http://51.158.102.51:29191/api/health
curl http://51.158.102.51:29291/public/health
```

---

## 🔧 **Update Your Demo Configuration**

Update your demo to use the correct ports:

```javascript
const edcConfig = {
  type: 'dataspaceConnector',
  authMethod: 'edc-api-key',
  edcApiKey: 'your-api-key-here', // Still need this from edc.api.auth.key
  
  // Updated endpoints with correct ports
  catalogEndpoint: 'http://51.158.102.51:29193/management/v2/catalog/request',
  contractNegotiationEndpoint: 'http://51.158.102.51:29193/management/v2/contractnegotiations',
  transferProcessEndpoint: 'http://51.158.102.51:29193/management/v2/transferprocesses',
  
  participantId: 'stbx-consumer',
  retryAttempts: 5,
  timeout: 30000
};
```

---

## 🚨 **Configuration Issue Alert**

**Problem**: Your `edc.dsp.callback.address=http://localhost:29194/protocol` is set to `localhost`, which means:
- Other connectors can't reach your connector for callbacks
- Dataspace protocol communication will fail
- Contract negotiations won't work properly

**Solution**: This needs to be changed to your public IP:
```properties
edc.dsp.callback.address=http://51.158.102.51:29194/protocol
```
Or better yet, use the HTTPS domain we'll set up:
```properties
edc.dsp.callback.address=https://consumer.connector-dev.startinblox.com/protocol
```