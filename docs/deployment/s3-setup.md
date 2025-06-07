# S3 Storage Setup Guide

## Overview

This guide explains how to configure an AWS S3 bucket for use with the Kukla Integration Service to resolve 403 Forbidden errors when accessing generated CSV files.

## Problem

When using S3 storage, generated CSV files return "403 Forbidden" when accessed directly via their URLs. This happens because:

1. Modern S3 buckets have "Block public ACLs" enabled by default
2. The bucket policy doesn't allow public read access
3. Object-level ACLs are blocked

## Solution: Configure S3 Bucket Policy

### Step 1: Access S3 Bucket Permissions

1. Go to the AWS S3 Console
2. Navigate to your bucket: `demo-commerce-integrations`
3. Click the **Permissions** tab

### Step 2: Update Block Public Access Settings

1. In the **Block public access** section, click **Edit**
2. **Uncheck** the following settings:
   - "Block public access to buckets and objects granted through new public bucket or access point policies"
   - "Block public and cross-account access to buckets and objects through any public bucket or access point policies"
3. Leave the ACL-related settings **checked** (modern best practice)
4. Click **Save changes**

### Step 3: Add Bucket Policy

In the **Bucket policy** section, add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::demo-commerce-integrations/kukla-integration/*"
    }
  ]
}
```

### Step 4: Verify Configuration

After applying the policy:

1. Generate a new CSV file using the action
2. Test the download URL - it should now return the file instead of 403 Forbidden

## Security Considerations

### Bucket Policy Benefits

- **Granular Control**: Only files in the `kukla-integration/` prefix are public
- **No ACL Dependencies**: Works with modern S3 security settings
- **Centralized Management**: All permissions managed at bucket level

### Alternative: Pre-signed URLs

For more security, you could modify the application to generate pre-signed URLs instead of public URLs:

```javascript
// In src/core/storage/index.js - potential future enhancement
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Generate a pre-signed URL valid for 1 hour
const downloadUrl = await getSignedUrl(
  s3Client,
  new GetObjectCommand({ Bucket: bucket, Key: key }),
  { expiresIn: 3600 }
);
```

## Testing

After configuration, test with:

```bash
# Generate new file
node scripts/test-action.js get-products

# Test direct access to the S3 URL shown in the output
curl -I "https://demo-commerce-integrations.s3.us-east-1.amazonaws.com/kukla-integration/products.csv"
```

Expected result: `HTTP/1.1 200 OK` instead of `HTTP/1.1 403 Forbidden`

## Troubleshooting

### Still Getting 403 Forbidden?

1. **Check bucket policy syntax** - Use the AWS Policy Generator or validator
2. **Verify region** - Ensure the S3 region matches your configuration
3. **Check IAM permissions** - Ensure your AWS credentials can write to the bucket
4. **Wait for propagation** - Policy changes can take a few minutes to take effect

### Alternative Bucket Names

If using a different bucket, update:

1. `config/environments/staging.js` - `storage.s3.bucket`
2. `config/environments/production.js` - `storage.s3.bucket`
3. The bucket policy ARN in Step 3 above

## Configuration Files

The storage configuration is in:

- **Staging**: `config/environments/staging.js`
- **Production**: `config/environments/production.js`

Current staging configuration:

```javascript
storage: {
  provider: 's3',
  s3: {
    region: 'us-east-1',
    bucket: 'demo-commerce-integrations',
    prefix: 'kukla-integration/',
  },
}
```
