# EDC Connector Analysis and Fix

## 📊 Test Results Analysis

Based on your test results, here's what we discovered:

```
✅ VM reachable
✅ Ports open: 29191, 29192, 29193, 29194, 29291
❌ Port 29195: Closed (Version API not running)
✅ Public API (29291): HTTP 401 (Authentication required - good!)
❌ Other APIs: HTTP 404 (Path issues)
```

## 🔍 **Root Cause: Path Configuration**

The issue is **path configuration**. Your EDC is configured with specific paths, but we're testing the wrong URLs.

**Your Configuration:**
```properties
web.http.management.path=/management  # We tested /management ❌
web.http.path=/api                   # We tested /api ❌
web.http.protocol.path=/protocol     # We tested /protocol ❌
web.http.public.path=/public         # We tested /public ✅ (got 401)
web.http.control.path=/control       # We tested /control ❌
```

## 🎯 **Correct URLs to Test**

### Fixed Testing Script:

```bash
#!/bin/bash
echo "=== Corrected EDC Endpoint Testing ==="
echo "Target: 51.158.102.51"
echo ""

echo "1. Testing correct endpoint paths..."

echo "Main API (29191/api):"
curl -I http://51.158.102.51:29191/api 2>/dev/null | head -1

echo "Management API (29193/management):"
curl -I http://51.158.102.51:29193/management 2>/dev/null | head -1

echo "Management API v2 (29193/management/v2):"
curl -I http://51.158.102.51:29193/management/v2 2>/dev/null | head -1

echo "Protocol API (29194/protocol):"  
curl -I http://51.158.102.51:29194/protocol 2>/dev/null | head -1

echo "Public API (29291/public):"
curl -I http://51.158.102.51:29291/public 2>/dev/null | head -1

echo "Control API (29192/control):"
curl -I http://51.158.102.51:29192/control 2>/dev/null | head -1

echo ""
echo "2. Testing authentication with correct paths..."

echo "Management API Assets:"
curl -s -o /dev/null -w "HTTP %{http_code}" http://51.158.102.51:29193/management/v2/assets
echo ""

echo "Management API Policies:"
curl -s -o /dev/null -w "HTTP %{http_code}" http://51.158.102.51:29193/management/v2/policies
echo ""

echo "Management API Catalog Request:"
curl -s -o /dev/null -w "HTTP %{http_code}" http://51.158.102.51:29193/management/v2/catalog/request
echo ""

echo ""
echo "3. Testing with potential authentication..."
echo "If you have an API key, test with:"
echo "curl -H 'X-Api-Key: YOUR-KEY' -I http://51.158.102.51:29193/management/v2/assets"
```

## 🔑 **Finding Your API Key**

Your EDC is clearly running and secured (401 on public API). You need to find the `edc.api.auth.key` value.

### Method 1: Check Configuration Files

```bash
# SSH to your VM
ssh user@51.158.102.51

# Look for EDC configuration
find / -name "*.properties" -o -name "*.yml" -o -name "*.yaml" 2>/dev/null | grep -i edc

# Search for the API key in config files
grep -r "edc.api.auth.key" /opt/ 2>/dev/null
grep -r "edc.api.auth.key" /etc/ 2>/dev/null  
grep -r "edc.api.auth.key" /home/ 2>/dev/null

# Check environment variables
env | grep -i edc
printenv | grep -i EDC
```

### Method 2: Check Docker Configuration (if using Docker)

```bash
# If running in Docker
docker ps | grep -i edc
docker inspect <container-name> | grep -i auth
docker exec <container-name> env | grep -i edc

# Check Docker Compose
docker-compose config | grep -i auth
```

### Method 3: Check Process Environment

```bash
# Find the Java process
ps aux | grep java | grep -i edc

# Get the process ID and check environment
sudo cat /proc/<PID>/environ | tr '\0' '\n' | grep -i edc
```

## 🧪 **Test with Common Default Keys**

Try these common EDC default API keys:

```bash
# Test with common defaults
for key in "password" "apikey" "test" "admin" "edc" "key" "auth"; do
    echo "Testing with key: $key"
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Api-Key: $key" http://51.158.102.51:29193/management/v2/assets)
    if [ "$response" = "200" ]; then
        echo "✅ SUCCESS! API Key is: $key"
        break
    elif [ "$response" = "401" ]; then
        echo "❌ $key - Wrong key"
    elif [ "$response" = "404" ]; then
        echo "❌ $key - Path issue"
    else
        echo "❌ $key - HTTP $response"
    fi
done
```

## 🔧 **Complete Working Test**

Once you find the API key, test the complete workflow:

```bash
#!/bin/bash
API_KEY="your-found-api-key"  # Replace with actual key

echo "=== Complete EDC Functionality Test ==="

echo "1. Test Management API Authentication:"
curl -H "X-Api-Key: $API_KEY" -I http://51.158.102.51:29193/management/v2/assets

echo "2. Test Catalog Request:"
curl -H "X-Api-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST http://51.158.102.51:29193/management/v2/catalog/request \
     -d '{
       "@context": ["https://w3id.org/edc/v0.0.1/ns/", "https://w3id.org/dspace/2024/1/context.json"],
       "@type": "https://w3id.org/edc/v0.0.1/ns/CatalogRequestMessage",
       "counterPartyAddress": "http://51.158.102.51:29194",
       "protocol": "dataspace-protocol-http"
     }'

echo "3. Test Assets List:"
curl -H "X-Api-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     http://51.158.102.51:29193/management/v2/assets

echo "4. Test Policies List:"
curl -H "X-Api-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     http://51.158.102.51:29193/management/v2/policies
```

## 📱 **Update Your Demo Configuration**

Once you have the API key, update your demo:

```javascript
// Correct configuration for your EDC
const edcConfig = {
  type: 'dataspaceConnector',
  authMethod: 'edc-api-key',
  edcApiKey: 'your-found-api-key', // The actual key from edc.api.auth.key
  
  // Correct endpoints with full URLs
  catalogEndpoint: 'http://51.158.102.51:29193/management/v2/catalog/request',
  contractNegotiationEndpoint: 'http://51.158.102.51:29193/management/v2/contractnegotiations',
  transferProcessEndpoint: 'http://51.158.102.51:29193/management/v2/transferprocesses',
  
  participantId: 'stbx-consumer',
  retryAttempts: 5,
  timeout: 30000
};
```

## 🚨 **Critical Configuration Fix Needed**

Your callback address is still pointing to localhost:
```properties
edc.dsp.callback.address=http://localhost:29194/protocol
```

This **must** be changed to:
```properties
edc.dsp.callback.address=http://51.158.102.51:29194/protocol
```

**How to fix:**
1. Find your EDC configuration file
2. Change the callback address
3. Restart your EDC connector

```bash
# Find the config file
find / -name "*.properties" 2>/dev/null | xargs grep -l "localhost:29194" 2>/dev/null

# Edit the file (example)
sudo nano /path/to/edc/application.properties

# Change:
# edc.dsp.callback.address=http://localhost:29194/protocol
# To:
# edc.dsp.callback.address=http://51.158.102.51:29194/protocol

# Restart EDC
sudo systemctl restart edc-connector
# OR
docker-compose restart edc-connector
```

## ✅ **Expected Results After Fix**

After finding the API key and fixing the callback address:

```bash
# Should return HTTP 200 with assets data
curl -H "X-Api-Key: YOUR-KEY" http://51.158.102.51:29193/management/v2/assets

# Should return HTTP 200 with catalog data  
curl -H "X-Api-Key: YOUR-KEY" \
     -H "Content-Type: application/json" \
     -X POST http://51.158.102.51:29193/management/v2/catalog/request \
     -d '{"@context": ["https://w3id.org/edc/v0.0.1/ns/"], "@type": "https://w3id.org/edc/v0.0.1/ns/CatalogRequestMessage", "counterPartyAddress": "http://51.158.102.51:29194", "protocol": "dataspace-protocol-http"}'
```

## 🎯 **Next Steps**

1. **Find the API key** using the methods above
2. **Test the corrected endpoints** with the new script
3. **Fix the callback address** in EDC configuration
4. **Update your demo** with the correct API key
5. **Test the sib-core integration** with working credentials

Your EDC is definitely running and properly secured - you just need the authentication key!