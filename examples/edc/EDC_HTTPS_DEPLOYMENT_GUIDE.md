# EDC Connector HTTPS Deployment Guide

## Complete Setup: nginx + Let's Encrypt + EDC Configuration

This guide will help you set up `consumer.connector-dev.startinblox.com` with HTTPS reverse proxy for your EDC connector.

---

## 🚀 **Step 1: DNS Configuration**

First, ensure your DNS is properly configured:

```bash
# Test DNS resolution
nslookup consumer.connector-dev.startinblox.com
dig consumer.connector-dev.startinblox.com

# Should resolve to: 51.158.102.51
```

**DNS Record Required**:
```
Type: A
Name: consumer.connector-dev.startinblox.com  
Value: 51.158.102.51
TTL: 300 (or default)
```

---

## 🔧 **Step 2: Install nginx and Certbot**

```bash
# SSH to your VM
ssh user@51.158.102.51

# Update system
sudo apt update && sudo apt upgrade -y

# Install nginx
sudo apt install nginx -y

# Install certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 📋 **Step 3: Configure nginx**

### Create the nginx configuration:

```bash
# Create the configuration file
sudo nano /etc/nginx/sites-available/edc-consumer

# Copy the nginx configuration (provided in nginx-edc-config.conf)
# Then enable the site
sudo ln -s /etc/nginx/sites-available/edc-consumer /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t
```

### Temporary HTTP-only config for SSL setup:

```bash
# Create temporary config for Let's Encrypt verification
sudo tee /etc/nginx/sites-available/edc-consumer-temp > /dev/null << 'EOF'
server {
    listen 80;
    server_name consumer.connector-dev.startinblox.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}
EOF

# Enable temporary config
sudo ln -sf /etc/nginx/sites-available/edc-consumer-temp /etc/nginx/sites-enabled/edc-consumer

# Reload nginx
sudo systemctl reload nginx
```

---

## 🔐 **Step 4: Obtain SSL Certificate**

```bash
# Get Let's Encrypt certificate
sudo certbot --nginx -d consumer.connector-dev.startinblox.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to share email with EFF
# - Certificate will be automatically configured

# Verify certificate installation
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 📝 **Step 5: Apply Full nginx Configuration**

After SSL certificate is obtained:

```bash
# Replace with full configuration
sudo cp /path/to/nginx-edc-config.conf /etc/nginx/sites-available/edc-consumer

# Update SSL certificate paths (certbot usually puts them here):
sudo sed -i 's|/etc/ssl/certs/consumer.connector-dev.startinblox.com.crt|/etc/letsencrypt/live/consumer.connector-dev.startinblox.com/fullchain.pem|' /etc/nginx/sites-available/edc-consumer

sudo sed -i 's|/etc/ssl/private/consumer.connector-dev.startinblox.com.key|/etc/letsencrypt/live/consumer.connector-dev.startinblox.com/privkey.pem|' /etc/nginx/sites-available/edc-consumer

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## ⚙️ **Step 6: Update EDC Configuration**

Update your EDC connector configuration:

### Required Changes:

```properties
# CRITICAL: Update callback address to use HTTPS domain
edc.dsp.callback.address=https://consumer.connector-dev.startinblox.com/protocol

# Keep existing port configuration
edc.participant.id=stbx-consumer
web.http.port=29191
web.http.path=/api
web.http.management.port=29193
web.http.management.path=/management
web.http.protocol.port=29194
web.http.protocol.path=/protocol
web.http.public.port=29291
web.http.public.path=/public
web.http.control.port=29192
web.http.control.path=/control
web.http.version.port=29195
web.http.version.path=/version

# Your existing auth key (still needed)
edc.api.auth.key=your-api-key-here
```

### Restart EDC:

```bash
# Restart your EDC connector (method depends on how it's deployed)
sudo systemctl restart edc-connector
# OR
docker-compose restart edc-connector
# OR 
./restart-edc.sh
```

---

## 🧪 **Step 7: Test the Complete Setup**

### Test HTTPS endpoints:

```bash
# Test domain resolution and SSL
curl -I https://consumer.connector-dev.startinblox.com

# Test Management API (what your demo needs)
curl -I https://consumer.connector-dev.startinblox.com/management/v2

# Test with authentication
curl -H "X-Api-Key: your-api-key" \
     -H "Content-Type: application/json" \
     https://consumer.connector-dev.startinblox.com/management/v2/assets

# Test Protocol API (for dataspace communication)
curl -I https://consumer.connector-dev.startinblox.com/protocol

# Test catalog endpoint specifically
curl -H "X-Api-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -X POST https://consumer.connector-dev.startinblox.com/management/v2/catalog/request \
     -d '{
       "@context": ["https://w3id.org/edc/v0.0.1/ns/", "https://w3id.org/dspace/2024/1/context.json"],
       "@type": "https://w3id.org/edc/v0.0.1/ns/CatalogRequestMessage",
       "counterPartyAddress": "https://consumer.connector-dev.startinblox.com",
       "protocol": "dataspace-protocol-http"
     }'
```

### Test HTTP to HTTPS redirect:

```bash
# Should redirect to HTTPS
curl -I http://consumer.connector-dev.startinblox.com
```

---

## 📱 **Step 8: Update Your Demo Configuration**

Update your sib-core demo to use the new HTTPS endpoints:

```javascript
// Updated configuration for HTTPS domain
const edcConfig = {
  type: 'dataspaceConnector',
  authMethod: 'edc-api-key',
  edcApiKey: 'your-api-key-here', // Get this from your EDC config
  
  // New HTTPS endpoints
  catalogEndpoint: 'https://consumer.connector-dev.startinblox.com/management/v2/catalog/request',
  contractNegotiationEndpoint: 'https://consumer.connector-dev.startinblox.com/management/v2/contractnegotiations',
  transferProcessEndpoint: 'https://consumer.connector-dev.startinblox.com/management/v2/transferprocesses',
  
  participantId: 'stbx-consumer',
  retryAttempts: 5,
  timeout: 30000
};
```

### Update the demo HTML:

```html
<!-- Update the connector IP field to use the domain -->
<div class="endpoint-info">
    <strong>Target EDC Connector:</strong> consumer.connector-dev.startinblox.com<br>
    <strong>Protocol:</strong> HTTPS<br>
    <strong>Participant ID:</strong> stbx-consumer
</div>
```

---

## 🔍 **Step 9: Monitoring and Troubleshooting**

### Monitor nginx logs:

```bash
# Watch access logs
sudo tail -f /var/log/nginx/edc-consumer.access.log

# Watch error logs
sudo tail -f /var/log/nginx/edc-consumer.error.log

# Watch all nginx logs
sudo tail -f /var/log/nginx/*.log
```

### Check SSL certificate status:

```bash
# Check certificate expiry
sudo certbot certificates

# Check SSL configuration
openssl s_client -connect consumer.connector-dev.startinblox.com:443 -servername consumer.connector-dev.startinblox.com

# Test SSL with curl
curl -vI https://consumer.connector-dev.startinblox.com 2>&1 | grep -E "(SSL|TLS|certificate|verify)"
```

### Common issues and solutions:

**Issue**: SSL certificate errors
```bash
# Renew certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal
```

**Issue**: nginx configuration errors
```bash
# Test configuration
sudo nginx -t

# Check syntax
sudo nginx -T

# Restart nginx
sudo systemctl restart nginx
```

**Issue**: EDC not accessible through proxy
```bash
# Check if EDC ports are listening locally
sudo netstat -tulpn | grep -E ':(29191|29192|29193|29194|29195|29291)'

# Test direct connection to EDC
curl -I http://127.0.0.1:29193/management/v2
```

---

## ✅ **Step 10: Verification Checklist**

Run through this checklist to verify everything works:

- [ ] DNS resolves to correct IP
- [ ] HTTPS certificate is valid and trusted
- [ ] HTTP redirects to HTTPS
- [ ] Management API accessible via HTTPS
- [ ] Protocol API accessible via HTTPS
- [ ] Authentication works with X-Api-Key
- [ ] EDC callback address updated
- [ ] sib-core demo connects successfully
- [ ] Catalog fetch works through demo

### Final test script:

```bash
#!/bin/bash
echo "=== EDC HTTPS Setup Verification ==="

echo "1. DNS Resolution:"
nslookup consumer.connector-dev.startinblox.com | grep -A1 "Name:"

echo "2. SSL Certificate:"
echo | openssl s_client -connect consumer.connector-dev.startinblox.com:443 -servername consumer.connector-dev.startinblox.com 2>/dev/null | openssl x509 -noout -dates

echo "3. HTTP Redirect:"
curl -s -I http://consumer.connector-dev.startinblox.com | head -1

echo "4. HTTPS Management API:"
curl -s -I https://consumer.connector-dev.startinblox.com/management/v2 | head -1

echo "5. Protocol API:"  
curl -s -I https://consumer.connector-dev.startinblox.com/protocol | head -1

echo "Setup verification complete!"
```

---

## 🎯 **Next Steps**

After completing this setup:

1. **Test your sib-core demo** with the new HTTPS endpoints
2. **Update any other applications** that connect to your EDC
3. **Set up monitoring** for the nginx proxy and SSL certificate
4. **Configure automatic certificate renewal** (usually already set up by certbot)
5. **Consider setting up additional security** (fail2ban, rate limiting, etc.)

Your EDC connector will now be accessible at:
- **Management API**: `https://consumer.connector-dev.startinblox.com/management/`
- **Protocol API**: `https://consumer.connector-dev.startinblox.com/protocol/`
- **Public API**: `https://consumer.connector-dev.startinblox.com/public/`

And your sib-core demo will be able to connect securely with CORS support enabled!