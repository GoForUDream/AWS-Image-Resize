# AWS Architecture

## Overview

Serverless image processing pipeline using AWS services. Key design principles:

- **Event-driven**: S3 upload automatically triggers Lambda
- **Serverless**: No servers to manage, auto-scales
- **Cost-effective**: Pay only for what you use (~$0 for development)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   POST /presign       PUT to S3           GET /status
      /upload          (direct)              ?key=
        │                   │                   │
        ▼                   │                   ▼
┌──────────────┐            │          ┌──────────────┐
│ API Gateway  │            │          │ API Gateway  │
└──────┬───────┘            │          └──────┬───────┘
       ▼                    │                 ▼
┌──────────────┐            │          ┌──────────────┐
│    Lambda    │            │          │    Lambda    │
│  (Presign)   │            │          │   (Status)   │
└──────┬───────┘            │          └──────────────┘
       │                    │
       │ Presigned URL      │
       └────────────────────┤
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    S3 BUCKET (Uploads)                           │
│                                                                  │
│  Triggers Lambda on new object (s3:ObjectCreated:*)             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAMBDA (Resize)                               │
│                                                                  │
│  - ARM64 (Graviton2) - 20% cheaper                              │
│  - Sharp library for image processing                            │
│  - Outputs: 150px, 320px, 640px, 1024px                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    S3 BUCKET (Resized)                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFRONT (CDN)                              │
│                                                                  │
│  - Edge caching for fast global delivery                        │
│  - CORS headers for browser downloads                            │
└─────────────────────────────────────────────────────────────────┘
```

## AWS Services

| Service | Purpose | Key Config |
|---------|---------|------------|
| **S3** | Storage | 2 buckets, CORS, event notifications |
| **Lambda** | Compute | ARM64, 512MB, 30s timeout |
| **API Gateway** | API | HTTP API ($1/million vs $3.50 REST) |
| **CloudFront** | CDN | Edge caching, CORS policy |
| **IAM** | Security | Least-privilege roles |

## Key Design Decisions

### 1. Presigned URLs
Browser uploads directly to S3, bypassing the server:
```
Without: Browser → Server → S3 (slow, server bottleneck)
With:    Browser → S3 (fast, direct)
```

### 2. ARM64 Lambda (Graviton2)
- 20% cheaper than x86
- Better performance for compute tasks
- Requires Docker build on Apple Silicon

### 3. CloudFront with CORS
- Required for browser `fetch()` downloads
- Response Headers Policy adds CORS automatically

### 4. HTTP API vs REST API
HTTP API costs $1/million requests vs $3.50 for REST API. Sufficient for this use case.

## Terraform Structure

```
terraform/
├── main.tf           # Provider, data sources
├── s3.tf             # Buckets, CORS, notifications
├── lambda.tf         # Functions, ARM64 config
├── api_gateway.tf    # HTTP API, routes
├── cloudfront.tf     # CDN, CORS policy
├── iam.tf            # Roles, policies
└── outputs.tf        # API URL, bucket names
```

## Cost Estimate

| Service | Free Tier | At Scale (10K images) |
|---------|-----------|----------------------|
| S3 | 5GB storage, 20K requests | ~$0.25 |
| Lambda | 1M requests, 400K GB-sec | ~$0.40 |
| API Gateway | 1M requests | ~$0.03 |
| CloudFront | 1TB transfer | ~$0.85 |
| **Total** | **$0** | **~$1.50** |

## Security

- No public S3 buckets (presigned URLs only)
- Short-lived URLs (5 min upload, 1 hour download)
- HTTPS enforced everywhere
- IAM least-privilege policies
