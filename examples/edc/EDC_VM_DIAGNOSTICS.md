# Eclipse EDC Connector VM Diagnostics Guide

## How to Check if EDC Connector is Running on 51.158.102.51

This guide provides step-by-step commands to verify if your Eclipse EDC connector is running properly on the VM.

---

## 🔍 **1. Basic Connectivity Tests**

### Test Network Connectivity
```bash
# Test if the VM is reachable
ping 51.158.102.51

# Test specific ports (EDC default ports)
telnet 51.158.102.51 29193  # Management API
telnet 51.158.102.51 29192  # Control Plane API  
telnet 51.158.102.51 29291  # Public API / Data Plane
telnet 51.158.102.51 29194  # Protocol API

# Alternative using nmap (if available)
nmap -p 29193,29192,29291,29194 51.158.102.51
```

### Test HTTP Endpoints
```bash
# Test Management API (most important)
curl -I http://51.158.102.51:29193
curl -I http://51.158.102.51:29193/management
curl -I http://51.158.102.51:29193/management/v2

# Test Public API
curl -I http://51.158.102.51:29291
curl -I http://51.158.102.51:29291/health

# Test Protocol API
curl -I http://51.158.102.51:29194
```

**Expected Responses**:
- **200 OK**: Endpoint is working
- **401/403**: Authentication required (good sign - EDC is running)
- **404**: Endpoint exists but path not found
- **Connection refused**: Service not running or port blocked

---

## 🖥️ **2. If You Have SSH Access to the VM**

### Check Running Processes
```bash
# SSH into the VM
ssh user@51.158.102.51

# Look for Java processes (EDC runs on JVM)
ps aux | grep -i java
ps aux | grep -i edc
ps aux | grep -i connector

# Check specific EDC process patterns
ps aux | grep "org.eclipse.edc"
ps aux | grep "connector"
ps aux | grep "runtime"
```

### Check Network Listeners
```bash
# Check what's listening on EDC ports
netstat -tulpn | grep :29193  # Management API
netstat -tulpn | grep :29192  # Control Plane
netstat -tulpn | grep :29291  # Data Plane/Public
netstat -tulpn | grep :29194  # Protocol API

# Alternative using ss command
ss -tulpn | grep -E ':(29291|29192|29193|29194)'

# Check all Java process ports
lsof -i -P | grep java
```

### Check System Services
```bash
# If EDC is running as a systemd service
systemctl status edc
systemctl status edc-connector
systemctl status dataspace-connector

# Check for any connector-related services
systemctl list-units --type=service | grep -i connector
systemctl list-units --type=service | grep -i edc

# Check Docker containers (if running in Docker)
docker ps
docker ps | grep -i edc
docker ps | grep -i connector
```

### Check Log Files
```bash
# Common log locations
tail -f /var/log/edc/connector.log
tail -f /opt/edc/logs/application.log
tail -f /home/*/edc/logs/*.log

# System logs
journalctl -u edc -f
journalctl -u edc-connector -f
journalctl | grep -i edc

# Docker logs (if applicable)
docker logs <container-id>
docker logs -f edc-connector
```

---

## 🐳 **3. Docker-Based EDC Deployment**

### Check Docker Containers
```bash
# List all running containers
docker ps

# Look for EDC-related containers
docker ps | grep -i edc
docker ps | grep -i connector
docker ps | grep -i dataspace

# Check container logs
docker logs <edc-container-name> --tail 50
docker logs <edc-container-name> -f

# Inspect specific container
docker inspect <edc-container-name>
```

### Check Docker Compose
```bash
# If using docker-compose
docker-compose ps
docker-compose logs
docker-compose logs edc-connector

# Check compose file
cat docker-compose.yml | grep -A 10 -B 5 edc
```

---

## ⚙️ **4. EDC-Specific Configuration Checks**

### Find EDC Configuration
```bash
# Look for EDC configuration files
find / -name "*edc*" -type f 2>/dev/null | grep -E '\.(properties|yml|yaml|json)$'
find /opt -name "application.properties" 2>/dev/null
find /etc -name "*edc*" 2>/dev/null
find /home -name "*edc*" -type f 2>/dev/null

# Check common configuration locations
cat /opt/edc/application.properties
cat /etc/edc/connector.properties  
cat /home/*/edc/application.properties
```

### Verify Configuration Values
```bash
# Look for key configuration properties
grep -r "edc.api.auth.key" /opt/ 2>/dev/null
grep -r "web.http.port" /opt/ 2>/dev/null
grep -r "web.http.management.port" /opt/ 2>/dev/null

# Check environment variables
env | grep -i edc
printenv | grep EDC
```

---

## 🔧 **5. EDC Health Check Endpoints**

### Test EDC Built-in Endpoints
```bash
# Health check (if enabled)
curl http://51.158.102.51:29291/health
curl http://51.158.102.51:29291/api/check/health
curl http://51.158.102.51:29193/health

# Liveness check
curl http://51.158.102.51:29291/api/check/liveness
curl http://51.158.102.51:29291/liveness

# Readiness check  
curl http://51.158.102.51:29291/api/check/readiness
curl http://51.158.102.51:29291/readiness

# Management API discovery
curl http://51.158.102.51:29193/management
curl http://51.158.102.51:29193/management/v2
curl http://51.158.102.51:29193/management/v3

# Protocol endpoint
curl http://51.158.102.51:29194/protocol
```

### Test API Endpoints (Without Authentication)
```bash
# These might return 401 but confirm EDC is running
curl -v http://51.158.102.51:29193/management/v2/assets
curl -v http://51.158.102.51:29193/management/v2/policies  
curl -v http://51.158.102.51:29193/management/v2/contractdefinitions

# Check OpenAPI documentation
curl http://51.158.102.51:29193/openapi
curl http://51.158.102.51:29193/swagger-ui.html
```

---

## 📊 **6. Advanced Diagnostics**

### Check JVM Information (if SSH available)
```bash
# If you can identify the Java process ID
jps -l  # List Java processes
jstack <pid>  # Stack trace
jstat -gc <pid>  # GC stats
jinfo <pid>  # JVM info
```

### Network Traffic Analysis
```bash
# Monitor network traffic on EDC ports
sudo tcpdump -i any port 29193
sudo tcpdump -i any port 29291

# Check firewall rules
sudo iptables -L -n
sudo ufw status  # Ubuntu firewall
```

### Resource Usage
```bash
# Check if system has enough resources
free -h  # Memory
df -h    # Disk space
top      # CPU usage
htop     # Better process viewer
```

---

## 🎯 **7. Remote Diagnostics (No SSH Access)**

### Port Scanning
```bash
# Comprehensive port scan
nmap -sT -O 51.158.102.51
nmap -p 1-65535 51.158.102.51  # Full scan (takes time)
nmap -p 29291,29192,29193,29194,8443,8444 51.158.102.51  # Common EDC ports
```

### HTTP Response Analysis
```bash
# Get detailed response headers
curl -I -v http://51.158.102.51:29193
curl -I -v http://51.158.102.51:29291

# Try different HTTP methods
curl -X GET http://51.158.102.51:29193/management/v2
curl -X OPTIONS http://51.158.102.51:29193/management/v2
curl -X HEAD http://51.158.102.51:29193/management/v2
```

### Service Discovery
```bash
# Try common EDC paths
for path in "" "api" "management" "management/v2" "health" "openapi" "swagger-ui.html" "actuator" "actuator/health"; do
  echo "Testing: http://51.158.102.51:29193/$path"
  curl -I http://51.158.102.51:29193/$path 2>/dev/null | head -1
done
```

---

## 🔍 **8. Determining EDC Version and Build**

### Version Detection
```bash
# Try to get version information
curl http://51.158.102.51:29291/version
curl http://51.158.102.51:29193/version
curl http://51.158.102.51:29291/api/version

# Check response headers for version info
curl -I http://51.158.102.51:29193/management/v2 2>/dev/null | grep -i server
curl -I http://51.158.102.51:29193/management/v2 2>/dev/null | grep -i version
```

### Build Information
```bash
# Look for build info endpoints
curl http://51.158.102.51:29291/info
curl http://51.158.102.51:29291/actuator/info
curl http://51.158.102.51:29193/info
```

---

## ✅ **9. Verification Checklist**

Run through this checklist to confirm EDC status:

### Quick Check Script
```bash
#!/bin/bash
echo "=== EDC Connector Diagnostic ==="
echo "Target: 51.158.102.51"
echo ""

echo "1. Testing connectivity..."
ping -c 1 51.158.102.51 > /dev/null 2>&1 && echo "✅ VM is reachable" || echo "❌ VM unreachable"

echo "2. Testing Management API (29193)..."
curl -I http://51.158.102.51:29193 2>/dev/null | head -1 | grep -q "HTTP" && echo "✅ Management API responding" || echo "❌ Management API not responding"

echo "3. Testing Public API (29291)..."  
curl -I http://51.158.102.51:29291 2>/dev/null | head -1 | grep -q "HTTP" && echo "✅ Public API responding" || echo "❌ Public API not responding"

echo "4. Testing Protocol API (29194)..."
curl -I http://51.158.102.51:29194 2>/dev/null | head -1 | grep -q "HTTP" && echo "✅ Protocol API responding" || echo "❌ Protocol API not responding"

echo "5. Testing authentication requirement..."
curl -s http://51.158.102.51:29193/management/v2/assets 2>/dev/null | grep -q "401\|403" && echo "✅ Authentication required (EDC secured)" || echo "⚠️ No authentication or different response"

echo ""
echo "=== Detailed Responses ==="
echo "Management API:"
curl -I http://51.158.102.51:29193 2>/dev/null | head -3

echo "Public API:"  
curl -I http://51.158.102.51:29291 2>/dev/null | head -3
```

### Expected Results for Running EDC

**✅ Healthy EDC Connector**:
- VM responds to ping
- Ports 29291, 29193, (29192, 29194) are open
- HTTP responses return proper status codes
- Authentication endpoints return 401/403
- Health endpoints return 200 OK

**❌ Issues**:
- Connection refused → Service not running
- Timeout → Firewall blocking ports  
- 500 errors → Service running but misconfigured
- No HTTP response → Wrong port or service

---

## 🚨 **10. Common Issues & Solutions**

### EDC Not Running
```bash
# If you have access, try starting EDC
sudo systemctl start edc
sudo systemctl start edc-connector

# Docker restart
docker-compose restart edc-connector
docker restart <edc-container-id>
```

### Port Issues
```bash
# Check if ports are blocked by firewall
sudo ufw allow 29291,29192,29193,29194/tcp

# Check iptables
sudo iptables -I INPUT -p tcp --dport 29193 -j ACCEPT
```

### Configuration Issues
```bash
# Check if EDC is configured for external access
grep -r "localhost\|127.0.0.1" /opt/edc/ 2>/dev/null
# Should bind to 0.0.0.0 for external access
```

This comprehensive diagnostic guide should help you determine exactly what's running (or not running) on your EDC connector VM!