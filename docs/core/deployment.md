# Deployment Guide

[← Back to README](../README.md) | Documentation: Deployment

---

## Overview

This guide covers the deployment process for the Adobe Commerce Integration Service using Adobe App Builder.

## Prerequisites

- Adobe Developer Console access
- Adobe App Builder CLI installed (`npm install -g @adobe/aio-cli`)
- Node.js 18.x or later
- Adobe Commerce instance configured
- Required environment variables

## Environment Setup

### Required Environment Variables

```plaintext
# Adobe App Builder
APP_BUILDER_PROJECT_ID=xxx
APP_BUILDER_WORKSPACE_ID=xxx
APP_BUILDER_ORG_ID=xxx

# Adobe Commerce
COMMERCE_INSTANCE_URL=xxx
COMMERCE_ACCESS_TOKEN=xxx
COMMERCE_INTEGRATION_ID=xxx

# Application
NODE_ENV=production
LOG_LEVEL=info
```

### Configuration Files

1. `.env` - Environment variables
2. `app.config.yaml` - App Builder configuration
3. `manifest.yml` - Action definitions

## Deployment Process

### 1. Build and Deploy

We have two main deployment scripts:

#### Full Deployment (`npm run deploy:full`)

Deploys both the web assets and serverless actions:

```bash
# This will:
# 1. Clean the dist directory
# 2. Build frontend assets
# 3. Build serverless actions
# 4. Deploy everything to App Builder
npm run deploy:full
```

#### Web-Only Deployment (`npm run deploy:web`)

Deploys only the web assets (faster for frontend-only changes):

```bash
# This will:
# 1. Clean the web-src/dist directory
# 2. Build frontend assets
# 3. Deploy only web assets to App Builder
npm run deploy:web
```

### 2. Post-Deployment Verification

After deployment, verify:

1. Web Interface
   - Navigate to your App Builder URL
   - Check for any console errors
   - Verify HTMX interactions
   - Test file operations

2. Serverless Actions
   - Check action logs in App Builder console
   - Verify API endpoints are responding
   - Test authentication flow
   - Monitor for any errors

## Deployment Environments

### Development

```bash
# Deploy to development workspace
WORKSPACE=development npm run deploy:full

# For frontend-only changes
WORKSPACE=development npm run deploy:web
```

### Staging

```bash
# Deploy to staging workspace
WORKSPACE=staging npm run deploy:full

# For frontend-only changes
WORKSPACE=staging npm run deploy:web
```

### Production

```bash
# Deploy to production workspace
WORKSPACE=production npm run deploy:full

# For frontend-only changes
WORKSPACE=production npm run deploy:web
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm ci
      - name: Deploy
        run: npm run deploy:full
        env:
          # Add required environment variables
          APP_BUILDER_PROJECT_ID: ${{ secrets.APP_BUILDER_PROJECT_ID }}
          APP_BUILDER_WORKSPACE_ID: ${{ secrets.APP_BUILDER_WORKSPACE_ID }}
          APP_BUILDER_ORG_ID: ${{ secrets.APP_BUILDER_ORG_ID }}
```

## Rollback Procedures

### Quick Rollback

1. Identify the last stable version tag
2. Check out that version
3. Run appropriate deployment command:

   ```bash
   # Full rollback
   npm run deploy:full

   # Web-only rollback
   npm run deploy:web
   ```

### Emergency Procedures

1. Stop incoming traffic
2. Assess impact
3. Execute rollback
4. Verify systems
5. Resume traffic

## Monitoring

### Health Checks

- API endpoint status
- Action execution metrics
- Error rates
- Response times

### Alerts

- Error threshold alerts
- Performance degradation
- Resource utilization
- Security incidents

## Troubleshooting

### Common Deployment Issues

1. Build Failures

   ```bash
   # Clean and rebuild
   npm run clean
   npm run build
   ```

2. Permission Issues
   - Verify Adobe I/O Runtime credentials
   - Check workspace access
   - Validate API tokens

3. Action Deployment Failures
   - Check action logs
   - Verify manifest.yml
   - Test action locally

### Debug Tools

```bash
# View action logs
aio runtime activation list

# Get specific activation details
aio runtime activation get <id>

# View recent deployments
aio app list deployments
```

## Security Considerations

### Production Safeguards

- Access control
- Data encryption
- API security
- Audit logging

### Compliance

- Security scanning
- Vulnerability checks
- Policy enforcement
- Access reviews

## Maintenance

### Regular Tasks

- Log rotation
- Cache clearing
- Configuration updates
- Security patches

### Updates

- Dependency updates
- Platform upgrades
- Security patches
- Feature deployments
