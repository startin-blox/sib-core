# EDC Management API v3 Testing Guide

## 🔄 EDC Management API v3 Changes

Your EDC connector is running Management API v3, which has **significant changes** from v2. Here are the key differences:

### **API Version Changes**
- **v2**: `/management/v2/assets`
- **v3**: `/management/v3/assets` ✅

### **v3 Specific Changes**
1. **New Request/Response Format**: More structured JSON-LD
2. **Enhanced Authentication**: Better token handling
3. **Updated Endpoints**: Some paths have changed
4. **Improved Error Responses**: Better error messaging

---

## 🧪 **Updated Testing Commands for v3**

### **Basic v3 Endpoint Testing**
```bash
#!/bin/bash
echo "=== EDC Management API v3 Testing ==="
echo "Target: 51.158.102.51 (stbx-consumer)"
echo ""

echo "1. Testing v3 Management API endpoints..."

echo "Management API Root (v3):"
curl -I http://51.158.102.51:29193/management/v3 2>/dev/null | head -1

echo "Assets (v3):"
curl -I http://51.158.102.51:29193/management/v3/assets 2>/dev/null | head -1

echo "Policies (v3):"  
curl -I http://51.158.102.51:29193/management/v3/policydefinitions 2>/dev/null | head -1

echo "Contract Definitions (v3):"
curl -I http://51.158.102.51:29193/management/v3/contractdefinitions 2>/dev/null | head -1

echo "Catalog Request (v3):"
curl -I http://51.158.102.51:29193/management/v3/catalog/request 2>/dev/null | head -1

echo "Contract Negotiations (v3):"
curl -I http://51.158.102.51:29193/management/v3/contractnegotiations 2>/dev/null | head -1

echo "Transfer Processes (v3):"
curl -I http://51.158.102.51:29193/management/v3/transferprocesses 2>/dev/null | head -1

echo ""
echo "2. Testing with API Key Authentication..."
echo "Note: Replace 'YOUR-API-KEY' with actual key from edc.api.auth.key"

echo "Test Assets with Auth:"
echo "curl -H 'X-Api-Key: YOUR-API-KEY' http://51.158.102.51:29193/management/v3/assets"

echo "Test Catalog with Auth:"
echo "curl -H 'X-Api-Key: YOUR-API-KEY' -H 'Content-Type: application/json' -X POST http://51.158.102.51:29193/management/v3/catalog/request -d '{...}'"
```

### **v3 Authentication Test**
```bash
#!/bin/bash
echo "=== Testing Common API Keys with v3 ==="

# Test common API keys with v3 endpoints
for key in "password" "apikey" "test" "admin" "edc" "key" "auth" "token"; do
    echo -n "Testing key '$key': "
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Api-Key: $key" http://51.158.102.51:29193/management/v3/assets)
    case $response in
        200) echo "✅ SUCCESS! API Key is: $key"; break ;;
        401|403) echo "❌ Wrong key" ;;
        404) echo "❌ Path issue" ;;
        *) echo "❌ HTTP $response" ;;
    esac
done
```

### **v3 Catalog Request Test**
```bash
#!/bin/bash
API_KEY="your-api-key"  # Replace with found key

echo "=== v3 Catalog Request Test ==="

curl -H "X-Api-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST http://51.158.102.51:29193/management/v3/catalog/request \
     -d '{
       "@context": {
         "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
         "edc": "https://w3id.org/edc/v0.0.1/ns/",
         "dcat": "https://www.w3.org/ns/dcat#",
         "dct": "https://purl.org/dc/terms/",
         "odrl": "http://www.w3.org/ns/odrl/2/"
       },
       "@type": "CatalogRequestMessage",
       "counterPartyAddress": "http://51.158.102.51:29194/protocol",
       "protocol": "dataspace-protocol-http"
     }'
```

---

## 🔧 **Key v3 API Changes**

### **1. Enhanced JSON-LD Context**
v3 uses more comprehensive JSON-LD contexts:
```json
{
  "@context": {
    "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
    "edc": "https://w3id.org/edc/v0.0.1/ns/",
    "dcat": "https://www.w3.org/ns/dcat#",
    "dct": "https://purl.org/dc/terms/",
    "odrl": "http://www.w3.org/ns/odrl/2/"
  }
}
```

### **2. Updated Endpoint Names**
- **v2**: `/management/v2/policies`
- **v3**: `/management/v3/policydefinitions` ✅

### **3. Enhanced Error Responses**
v3 provides more detailed error information with proper JSON-LD structure.

---

## 📝 **Working v3 Configuration**

### **For Your sib-core Demo:**
```javascript
const edcV3Config = {
  type: 'dataspaceConnector',
  authMethod: 'edc-api-key',
  edcApiKey: 'your-found-api-key', // From edc.api.auth.key
  
  // v3 Management API endpoints
  catalogEndpoint: 'http://51.158.102.51:29193/management/v3/catalog/request',
  contractNegotiationEndpoint: 'http://51.158.102.51:29193/management/v3/contractnegotiations',
  transferProcessEndpoint: 'http://51.158.102.51:29193/management/v3/transferprocesses',
  
  // Additional v3 endpoints
  assetsEndpoint: 'http://51.158.102.51:29193/management/v3/assets',
  policiesEndpoint: 'http://51.158.102.51:29193/management/v3/policydefinitions',
  contractDefinitionsEndpoint: 'http://51.158.102.51:29193/management/v3/contractdefinitions',
  
  participantId: 'stbx-consumer',
  retryAttempts: 5,
  timeout: 30000,
  apiVersion: 'v3' // Flag to indicate v3 usage
};
```

---

## 🚀 **Quick v3 Verification**

Run this to verify your v3 setup works:

```bash
#!/bin/bash
echo "=== Quick EDC v3 Verification ==="

# Test basic v3 endpoint
echo "1. Testing v3 Management API:"
response=$(curl -s -o /dev/null -w "%{http_code}" http://51.158.102.51:29193/management/v3)
if [ "$response" = "200" ] || [ "$response" = "401" ]; then
    echo "✅ v3 Management API is available (HTTP $response)"
else
    echo "❌ v3 Management API issue (HTTP $response)"
fi

# Test v3 assets endpoint
echo "2. Testing v3 Assets endpoint:"
response=$(curl -s -o /dev/null -w "%{http_code}" http://51.158.102.51:29193/management/v3/assets)
if [ "$response" = "401" ]; then
    echo "✅ v3 Assets endpoint available (needs authentication)"
elif [ "$response" = "200" ]; then
    echo "✅ v3 Assets endpoint available (no auth required)"
else
    echo "❌ v3 Assets endpoint issue (HTTP $response)"
fi

# Test v3 catalog endpoint
echo "3. Testing v3 Catalog endpoint:"
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://51.158.102.51:29193/management/v3/catalog/request)
if [ "$response" = "401" ] || [ "$response" = "400" ]; then
    echo "✅ v3 Catalog endpoint available (HTTP $response)"
else
    echo "❌ v3 Catalog endpoint issue (HTTP $response)"
fi

echo ""
echo "Next step: Find your API key and test with authentication!"
```

---

## 🎯 **Expected v3 Results**

After running these tests with the correct API key, you should see:

```bash
# Successful v3 responses:
curl -H "X-Api-Key: YOUR-KEY" http://51.158.102.51:29193/management/v3/assets
# Returns: HTTP 200 with assets JSON array

curl -H "X-Api-Key: YOUR-KEY" -H "Content-Type: application/json" -X POST http://51.158.102.51:29193/management/v3/catalog/request -d '{...v3 request...}'
# Returns: HTTP 200 with catalog JSON-LD
```

The v3 API should resolve all your HTTP 404 issues once you:
1. **Use v3 endpoints** instead of v2
2. **Find the correct API key** from your EDC configuration
3. **Update your sib-core store** to use v3 paths

Would you like me to update the store implementation and types for v3 compatibility next?