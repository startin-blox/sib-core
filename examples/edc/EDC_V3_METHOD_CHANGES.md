# EDC Management API v3 Method Changes

## 🔄 **Critical v3 Change: GET → POST**

**Major Change in v3**: Many endpoints that used GET requests in v2 now require POST requests with query specifications.

### **v2 vs v3 Method Comparison**

| Endpoint | v2 Method | v3 Method | v3 Body Required |
|----------|-----------|-----------|------------------|
| Assets | `GET /v2/assets` | `POST /v3/assets/request` | ✅ QuerySpec |
| Policies | `GET /v2/policies` | `POST /v3/policydefinitions/request` | ✅ QuerySpec |
| Contract Definitions | `GET /v2/contractdefinitions` | `POST /v3/contractdefinitions/request` | ✅ QuerySpec |
| Contract Negotiations | `GET /v2/contractnegotiations` | `POST /v3/contractnegotiations/request` | ✅ QuerySpec |
| Transfer Processes | `GET /v2/transferprocesses` | `POST /v3/transferprocesses/request` | ✅ QuerySpec |
| Catalog | `POST /v2/catalog/request` | `POST /v3/catalog/request` | ✅ CatalogRequest |

### **v3 QuerySpec Format**

All v3 POST requests require a QuerySpec body:

```json
{
  "@context": {
    "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
    "edc": "https://w3id.org/edc/v0.0.1/ns/"
  },
  "@type": "QuerySpec",
  "offset": 0,
  "limit": 50,
  "filterExpression": [],
  "sortField": null,
  "sortOrder": "ASC"
}
```

---

## 🧪 **Corrected v3 Testing Commands**

### **Test v3 Assets (POST method)**
```bash
#!/bin/bash
API_KEY="your-api-key"  # Replace with actual key

echo "=== Testing v3 Assets with POST ==="

# Correct v3 assets request
curl -H "X-Api-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST http://51.158.102.51:29193/management/v3/assets/request \
     -d '{
       "@context": {
         "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
         "edc": "https://w3id.org/edc/v0.0.1/ns/"
       },
       "@type": "QuerySpec",
       "offset": 0,
       "limit": 50
     }'
```

### **Test v3 Policy Definitions (POST method)**
```bash
# Correct v3 policy definitions request
curl -H "X-Api-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST http://51.158.102.51:29193/management/v3/policydefinitions/request \
     -d '{
       "@context": {
         "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
         "edc": "https://w3id.org/edc/v0.0.1/ns/"
       },
       "@type": "QuerySpec",
       "offset": 0,
       "limit": 50
     }'
```

### **Test v3 Contract Definitions (POST method)**
```bash
# Correct v3 contract definitions request
curl -H "X-Api-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST http://51.158.102.51:29193/management/v3/contractdefinitions/request \
     -d '{
       "@context": {
         "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
         "edc": "https://w3id.org/edc/v0.0.1/ns/"
       },
       "@type": "QuerySpec",
       "offset": 0,
       "limit": 50
     }'
```

---

## 🔧 **Complete v3 Method Testing Script**

```bash
#!/bin/bash
API_KEY="your-api-key"  # Replace with actual key
BASE_URL="http://51.158.102.51:29193/management/v3"

echo "=== Complete EDC v3 Method Testing ==="
echo "Using correct POST methods for v3 API"
echo ""

# Standard QuerySpec for list endpoints
QUERY_SPEC='{
  "@context": {
    "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
    "edc": "https://w3id.org/edc/v0.0.1/ns/"
  },
  "@type": "QuerySpec",
  "offset": 0,
  "limit": 50
}'

echo "1. Testing Assets (POST /assets/request):"
curl -H "X-Api-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST "$BASE_URL/assets/request" \
     -d "$QUERY_SPEC"
echo -e "\n"

echo "2. Testing Policy Definitions (POST /policydefinitions/request):"
curl -H "X-Api-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST "$BASE_URL/policydefinitions/request" \
     -d "$QUERY_SPEC"
echo -e "\n"

echo "3. Testing Contract Definitions (POST /contractdefinitions/request):"
curl -H "X-Api-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST "$BASE_URL/contractdefinitions/request" \
     -d "$QUERY_SPEC"
echo -e "\n"

echo "4. Testing Contract Negotiations (POST /contractnegotiations/request):"
curl -H "X-Api-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST "$BASE_URL/contractnegotiations/request" \
     -d "$QUERY_SPEC"
echo -e "\n"

echo "5. Testing Transfer Processes (POST /transferprocesses/request):"
curl -H "X-Api-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST "$BASE_URL/transferprocesses/request" \
     -d "$QUERY_SPEC"
echo -e "\n"

echo "6. Testing Catalog (POST /catalog/request):"
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
     }'
echo -e "\n"
```

---

## 📋 **v3 Endpoint Reference**

### **Correct v3 Endpoints and Methods:**

```
POST /management/v3/assets/request              ← Assets list
POST /management/v3/policydefinitions/request   ← Policy definitions  
POST /management/v3/contractdefinitions/request ← Contract definitions
POST /management/v3/contractnegotiations/request ← Contract negotiations
POST /management/v3/transferprocesses/request   ← Transfer processes
POST /management/v3/catalog/request             ← Catalog request

# Individual resource operations (still use RESTful methods):
GET  /management/v3/assets/{id}                 ← Get specific asset
POST /management/v3/assets                      ← Create asset
PUT  /management/v3/assets/{id}                 ← Update asset
DELETE /management/v3/assets/{id}               ← Delete asset
```

---

## ⚠️ **Why This Change Was Made**

**v3 Design Philosophy:**
1. **Consistent Query Interface**: All list operations use QuerySpec
2. **Advanced Filtering**: Support for complex filters and sorting
3. **Pagination Support**: Built-in offset/limit functionality
4. **Type Safety**: Strongly typed request/response formats
5. **Future Extensibility**: Easier to add new query capabilities

---

## 🎯 **What You Should Test Now**

1. **First, test the method discovery:**
   ```bash
   # This should return 405 Method Not Allowed (confirms GET not supported)
   curl -I http://51.158.102.51:29193/management/v3/assets
   
   # This should work (POST with QuerySpec)
   curl -H "X-Api-Key: your-key" -X POST http://51.158.102.51:29193/management/v3/assets/request
   ```

2. **Then test with proper QuerySpec body:**
   Use the complete script above with your actual API key.

3. **Expected Results:**
   - ❌ `GET /v3/assets` → HTTP 405 Method Not Allowed
   - ✅ `POST /v3/assets/request` → HTTP 200 with assets JSON

This explains the HTTP 405 errors you're seeing - EDC v3 requires POST methods with QuerySpec bodies for list operations!