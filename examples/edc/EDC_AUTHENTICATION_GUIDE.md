# Eclipse EDC Connector Authentication Guide

## How to Get Your API Key from EDC Connector at 51.158.102.51

This guide explains how to obtain and use authentication credentials for your Eclipse Dataspace Components (EDC) connector instance.

## 🔑 EDC Authentication Methods

Eclipse EDC supports multiple authentication mechanisms:

1. **EDC API Key** (Most Common - Recommended)
2. **Bearer Token** (JWT-based)
3. **OAuth2 Client Credentials**
4. **Delegated Authentication** (with external IdP)

---

## Method 1: EDC API Key Authentication (Recommended)

### How EDC API Key Works

The EDC connector uses a simple API key mechanism configured via the `edc.api.auth.key` property. This key is sent in the `X-Api-Key` header for all Management API requests.

### Finding Your API Key

#### Option A: Check EDC Configuration Files

1. **Look for configuration properties**:
   ```properties
   # In application.properties or similar config file
   edc.api.auth.key=your-api-key-here
   ```

2. **Common configuration locations**:
   - `application.properties`
   - `application.yml`
   - Environment variables: `EDC_API_AUTH_KEY`
   - Docker compose file environment variables

#### Option B: Check EDC Startup Logs

When EDC starts, it may log the API key configuration (usually masked):
```
INFO  [TokenBasedAuthenticationService] API Key authentication configured
INFO  [ManagementApiController] Management API secured with API key: ****
```

#### Option C: Contact EDC Administrator

If you don't have direct access to the EDC configuration:
- Contact the administrator of the EDC connector at `51.158.102.51`
- Request the Management API key
- Ask for the complete API endpoint URLs

### Using the API Key

Once you have the API key, use it in the demo:

1. Select **"EDC API Key (X-Api-Key)"** as authentication method
2. Enter your API key in the **"EDC API Key"** field
3. Click **"Initialize Store"**

**Example Configuration**:
```javascript
const config = {
  type: 'dataspaceConnector',
  authMethod: 'edc-api-key',
  edcApiKey: 'your-actual-api-key-here',
  catalogEndpoint: 'http://51.158.102.51:8182/management/v2/catalog/request',
  contractNegotiationEndpoint: 'http://51.158.102.51:8182/management/v2/contractnegotiations',
  transferProcessEndpoint: 'http://51.158.102.51:8182/management/v2/transferprocesses'
};
```

---

## Method 2: Bearer Token Authentication

### When to Use Bearer Tokens

Use this method if your EDC connector is configured with:
- JWT-based authentication
- External token validation
- Custom authentication providers

### Getting Bearer Tokens

Bearer tokens are typically obtained from an authentication service:

```bash
# Example token request (adjust URL and credentials)
curl -X POST http://51.158.102.51:8080/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=your-client&client_secret=your-secret"
```

### Using Bearer Tokens

1. Select **"Bearer Token"** as authentication method
2. Enter your JWT token in the **"Bearer Token"** field
3. Token will be sent in `Authorization: Bearer <token>` header

---

## Method 3: OAuth2 Client Credentials

### OAuth2 Configuration

If your EDC is integrated with an OAuth2 provider (like Keycloak):

1. **Token Endpoint**: Usually `https://keycloak.example.com/auth/realms/edc/protocol/openid-connect/token`
2. **Client ID**: Your registered client identifier
3. **Client Secret**: Your client secret
4. **Scope**: Typically `edc:all` or similar

### Using OAuth2

1. Select **"OAuth2"** as authentication method
2. Fill in all OAuth2 configuration fields
3. The store will automatically obtain and refresh tokens

---

## Method 4: EDC Delegated Authentication

### Advanced Authentication

For EDC connectors using the new `DelegatingAuthenticationService`:

1. **DAC Key URL**: The EDC's delegated auth key endpoint
2. **Identity Provider**: External OAuth2/OIDC provider
3. **Client Credentials**: For the external IdP

### Configuration Example

```javascript
const config = {
  authMethod: 'delegated',
  delegatedAuthConfig: {
    keyUrl: 'http://51.158.102.51:8182/auth/key',
    identityProviderEndpoint: 'https://keycloak.example.com/auth/realms/edc/protocol/openid-connect/token',
    clientId: 'edc-client',
    clientSecret: 'your-secret'
  }
};
```

---

## 🚀 Quick Start for 51.158.102.51

### Step 1: Identify Your EDC Setup

**Check if the EDC is accessible**:
```bash
# Test basic connectivity
curl -I http://51.158.102.51:8182/management/v2/catalog/request

# Expected response: HTTP 401 or 403 (authentication required)
# If you get 200, authentication might not be enabled
# If you get connection refused, check the port or firewall
```

### Step 2: Try Common API Key Values

**Common default API keys** (try these first):
- `password` (EDC default)
- `apikey`
- `test`
- `admin`
- `edc-key`

### Step 3: Test Authentication

Use curl to test authentication:

```bash
# Test with API key
curl -H "X-Api-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -X POST http://51.158.102.51:8182/management/v2/catalog/request \
     -d '{
       "@context": ["https://w3id.org/edc/v0.0.1/ns/", "https://w3id.org/dspace/2024/1/context.json"],
       "@type": "https://w3id.org/edc/v0.0.1/ns/CatalogRequestMessage",
       "counterPartyAddress": "http://51.158.102.51:8182",
       "protocol": "dataspace-protocol-http"
     }'

# Expected: 200 OK with catalog data
# If 401/403: Wrong API key
# If 400: Request format issue
```

### Step 4: Use in Demo

Once you have the correct API key:

1. Open `http://127.0.0.1:3000/examples/dataspace-connector-demo.html`
2. Set **Management API Port** to `8182`
3. Select **"EDC API Key (X-Api-Key)"**
4. Enter your API key
5. Click **"Initialize Store"**
6. Click **"Fetch Catalog"** to test

---

## 🛠️ Troubleshooting

### Common Issues

**1. Connection Refused**
- Check if EDC is running on port 8182
- Verify firewall/network access
- Try different ports (8080, 8181, 8282)

**2. 401 Unauthorized**
- Wrong API key
- API key not configured in EDC
- Check header format (`X-Api-Key` vs `X-API-Key`)

**3. 403 Forbidden**
- Correct authentication but insufficient permissions
- API key valid but limited access

**4. CORS Errors**
- EDC doesn't allow cross-origin requests
- Run demo from same origin or configure CORS

### Debug Steps

1. **Check EDC Health**:
   ```bash
   curl http://51.158.102.51:8182/health
   ```

2. **Check Management API**:
   ```bash
   curl http://51.158.102.51:8182/management/v2
   ```

3. **Inspect Network Traffic**:
   - Open browser dev tools
   - Watch Network tab during requests
   - Check request headers and response codes

---

## 📞 Getting Help

If you still can't authenticate:

1. **Contact EDC Administrator**: Ask for the Management API credentials
2. **Check EDC Documentation**: Review the specific EDC version documentation
3. **EDC Community**: Ask in Eclipse EDC discussions or Slack
4. **Configuration Files**: Request access to EDC configuration files

---

## 🔒 Security Notes

- **Never share API keys publicly**
- **Use HTTPS in production**
- **Rotate keys regularly**
- **Use least-privilege access**
- **Monitor authentication logs**

---

## Example Working Configuration

Here's a complete working example once you have your credentials:

```javascript
// Working configuration example
const edcConfig = {
  type: 'dataspaceConnector',
  authMethod: 'edc-api-key',
  edcApiKey: 'your-actual-api-key',
  catalogEndpoint: 'http://51.158.102.51:8182/management/v2/catalog/request',
  contractNegotiationEndpoint: 'http://51.158.102.51:8182/management/v2/contractnegotiations',
  transferProcessEndpoint: 'http://51.158.102.51:8182/management/v2/transferprocesses',
  retryAttempts: 5,
  timeout: 30000
};

// Initialize and test
const store = StoreFactory.create(edcConfig);
const catalog = await store.getCatalog();
console.log('Catalog:', catalog);
```

This authentication guide should help you successfully connect to your EDC connector at 51.158.102.51!