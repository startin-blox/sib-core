# Complete EDC v3 Setup and Configuration Guide

## 🚀 **Step 1: Test Your v3 EDC Endpoints**

First, let's verify your EDC v3 API is working:

```bash
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
```

## 🔑 **Step 2: Find Your API Key**

Your EDC is secured, so you need the API key. Try these methods:

### **Method A: Test Common Keys**
```bash
#!/bin/bash
echo "=== Testing Common API Keys ==="

for key in "password" "apikey" "test" "admin" "edc" "key" "auth" "token" "stbx" "consumer"; do
    echo -n "Testing '$key': "
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Api-Key: $key" http://51.158.102.51:29193/management/v3/assets)
    case $response in
        200) echo "✅ SUCCESS! Your API key is: $key"; API_KEY="$key"; break ;;
        401|403) echo "❌ Wrong key" ;;
        404) echo "⚠️ Path issue (but key might be right)" ;;
        *) echo "❌ HTTP $response" ;;
    esac
done

if [ ! -z "$API_KEY" ]; then
    echo ""
    echo "🎉 Found working API key: $API_KEY"
    echo "Testing catalog request..."
    curl -H "X-Api-Key: $API_KEY" \
         -H "Content-Type: application/json" \
         -X POST http://51.158.102.51:29193/management/v3/catalog/request \
         -d '{
           "@context": {
             "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
             "edc": "https://w3id.org/edc/v0.0.1/ns/",
             "dcat": "https://www.w3.org/ns/dcat#"
           },
           "@type": "CatalogRequestMessage",
           "counterPartyAddress": "http://51.158.102.51:29194/protocol",
           "protocol": "dataspace-protocol-http"
         }'
fi
```

### **Method B: Check Configuration (if you have SSH access)**
```bash
# SSH to your VM
ssh user@51.158.102.51

# Look for EDC config files
find / -name "*.properties" -o -name "*.yml" 2>/dev/null | xargs grep -l "edc.api.auth.key" 2>/dev/null

# Search for the key
grep -r "edc.api.auth.key" /opt/ /etc/ /home/ 2>/dev/null

# Check environment variables
env | grep -i "EDC.*AUTH"
printenv | grep -E "EDC_API_AUTH_KEY|API_KEY"
```

## 📝 **Step 3: Configure Your sib-core Store for v3**

Once you have the API key, update your configuration:

### **v3 Configuration Template**
```javascript
// Complete v3 EDC Configuration
const edcV3Config = {
  type: 'dataspaceConnector',
  authMethod: 'edc-api-key',
  edcApiKey: 'YOUR-FOUND-API-KEY', // Replace with actual key
  
  // v3 API endpoints (note the /v3/ in paths)
  endpoint: 'http://51.158.102.51:29193',
  catalogEndpoint: 'http://51.158.102.51:29193/management/v3/catalog/request',
  contractNegotiationEndpoint: 'http://51.158.102.51:29193/management/v3/contractnegotiations',
  transferProcessEndpoint: 'http://51.158.102.51:29193/management/v3/transferprocesses',
  
  // Additional v3 endpoints
  assetsEndpoint: 'http://51.158.102.51:29193/management/v3/assets',
  policiesEndpoint: 'http://51.158.102.51:29193/management/v3/policydefinitions',
  contractDefinitionsEndpoint: 'http://51.158.102.51:29193/management/v3/contractdefinitions',
  
  // Configuration
  participantId: 'stbx-consumer',
  apiVersion: 'v3',
  retryAttempts: 5,
  timeout: 30000
};
```

### **Test the Configuration**
```javascript
// Test script to validate v3 configuration
import { StoreFactory } from './src/libs/store/StoreFactory.ts';
import { StoreType } from './src/libs/store/IStore.ts';

async function testV3Configuration() {
  try {
    console.log('Testing EDC v3 configuration...');
    
    const store = StoreFactory.create(edcV3Config);
    
    // Test catalog fetch
    console.log('Fetching catalog...');
    const catalog = await store.getCatalog();
    console.log('Catalog result:', catalog);
    
    // Test assets fetch (if method exists)
    if (store.getAssets) {
      console.log('Fetching assets...');
      const assets = await store.getAssets();
      console.log('Assets result:', assets);
    }
    
    console.log('✅ v3 configuration working!');
  } catch (error) {
    console.error('❌ Configuration error:', error);
  }
}

testV3Configuration();
```

## 🧪 **Step 4: Complete v3 API Testing**

### **Full v3 Functional Test**
```bash
#!/bin/bash
API_KEY="your-found-api-key"  # Replace with actual key
BASE_URL="http://51.158.102.51:29193/management/v3"

echo "=== Complete EDC v3 API Test ==="
echo "Using API Key: $API_KEY"
echo "Base URL: $BASE_URL"
echo ""

# Test all v3 endpoints
echo "1. Testing Assets:"
curl -H "X-Api-Key: $API_KEY" "$BASE_URL/assets" | jq '.' 2>/dev/null || echo "Raw response"

echo "2. Testing Policy Definitions:"
curl -H "X-Api-Key: $API_KEY" "$BASE_URL/policydefinitions" | jq '.' 2>/dev/null || echo "Raw response"

echo "3. Testing Contract Definitions:"
curl -H "X-Api-Key: $API_KEY" "$BASE_URL/contractdefinitions" | jq '.' 2>/dev/null || echo "Raw response"

echo "4. Testing Catalog Request:"
curl -H "X-Api-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST "$BASE_URL/catalog/request" \
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
     }' | jq '.' 2>/dev/null || echo "Raw response"

echo "5. Testing Contract Negotiations:"
curl -H "X-Api-Key: $API_KEY" "$BASE_URL/contractnegotiations" | jq '.' 2>/dev/null || echo "Raw response"

echo "6. Testing Transfer Processes:"
curl -H "X-Api-Key: $API_KEY" "$BASE_URL/transferprocesses" | jq '.' 2>/dev/null || echo "Raw response"
```

## 🔧 **Step 5: Fix Critical Configuration Issue**

**Important**: Your callback address is still using localhost:

```properties
# Current (problematic):
edc.dsp.callback.address=http://localhost:29194/protocol

# Should be:
edc.dsp.callback.address=http://51.158.102.51:29194/protocol
```

**To fix this:**
1. Find your EDC configuration file
2. Update the callback address
3. Restart EDC connector

```bash
# Find the config file
grep -r "localhost:29194" /opt/ /etc/ /home/ 2>/dev/null

# Edit the file (example path)
sudo nano /opt/edc/application.properties

# Change the line and restart
sudo systemctl restart edc-connector
# OR
docker-compose restart edc-connector
```

## 📱 **Step 6: Update Your Demo**

The sib-core store has been updated for v3 compatibility. Use this configuration in your demo:

```html
<!-- Update the demo configuration -->
<script>
const edcConfig = {
  type: 'dataspaceConnector',
  authMethod: 'edc-api-key',
  edcApiKey: 'YOUR-API-KEY', // Replace with found key
  
  endpoint: 'http://51.158.102.51:29193',
  catalogEndpoint: 'http://51.158.102.51:29193/management/v3/catalog/request',
  contractNegotiationEndpoint: 'http://51.158.102.51:29193/management/v3/contractnegotiations',
  transferProcessEndpoint: 'http://51.158.102.51:29193/management/v3/transferprocesses',
  
  participantId: 'stbx-consumer',
  apiVersion: 'v3',
  retryAttempts: 5,
  timeout: 30000
};

// Initialize store with v3 config
const store = StoreFactory.create(edcConfig);
</script>
```

## ✅ **Expected v3 Results**

After completing these steps, you should see:

### **Successful API Responses:**
```json
// Assets endpoint
{
  "@context": {...},
  "@type": "Collection",
  "value": [...] // Array of assets
}

// Catalog request
{
  "@context": {...},
  "@type": "Catalog",
  "participantId": "stbx-consumer",
  "dcat:dataset": [...] // Array of datasets
}
```

### **Working Demo:**
- ✅ Store initialization succeeds
- ✅ Catalog fetch returns data
- ✅ Authentication works with X-Api-Key
- ✅ v3 JSON-LD responses are properly parsed

## 🎯 **Next Steps**

1. **Run the v3 endpoint test** to confirm v3 API is available
2. **Find your API key** using the testing script
3. **Test the complete v3 functionality** with the found key
4. **Fix the callback address** in EDC configuration
5. **Update your sib-core demo** with v3 configuration
6. **Test end-to-end functionality** through the demo

Your EDC connector is running v3 API, which explains the HTTP 404 errors with v2 endpoints. The updated store implementation now supports both v2 and v3, defaulting to v3 for your setup!