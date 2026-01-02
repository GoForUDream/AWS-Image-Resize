# AWS Image Resizer

A serverless image processing application built with AWS. Upload an image, get multiple resized versions delivered via CDN.

## Architecture

```
┌──────────┐    ┌─────────────┐    ┌─────────────┐
│  React   │───▶│ API Gateway │───▶│   Lambda    │
│ Frontend │    └─────────────┘    │  (Presign)  │
└────┬─────┘                       └─────────────┘
     │ Direct Upload                      │
     ▼                                    ▼
┌──────────┐    S3 Event     ┌──────────────────┐
│    S3    │────Trigger─────▶│     Lambda       │──▶ S3 ──▶ CloudFront
│ (Upload) │                 │ (Resize/ARM64)   │        (CDN)
└──────────┘                 └──────────────────┘
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite |
| **AWS** | S3, Lambda (ARM64), API Gateway, CloudFront, IAM |
| **IaC** | Terraform |
| **Processing** | Sharp (Node.js image library) |

## Key Features

- **Serverless** - Auto-scales, pay-per-use
- **Event-driven** - S3 upload triggers automatic resize
- **CDN Delivery** - CloudFront edge caching for fast downloads
- **ARM64 Lambda** - 20% cheaper than x86
- **Presigned URLs** - Direct S3 upload (no server bottleneck)

## Quick Start

### Local Development
```bash
npm run install:all
npm run dev
```

### AWS Deployment
```bash
# Build Lambda (Docker required for Apple Silicon)
cd lambda
docker run --rm --entrypoint "" -v "$PWD":/var/task -w /var/task \
  public.ecr.aws/lambda/nodejs:20 npm install
cd ..

# Deploy
cd terraform
terraform init && terraform apply
```

## Project Structure

```
├── frontend/          # React app
├── backend/           # Local dev server
├── lambda/            # Resize function (S3-triggered)
├── lambda-presign/    # API function (presigned URLs)
├── terraform/         # Infrastructure as Code
└── docs/              # Architecture documentation
```

## Cost

| Usage | Monthly Cost |
|-------|-------------|
| Development | $0 (Free Tier) |
| 10,000 images | ~$1.50 |

## Documentation

- [Architecture Details](docs/AWS_ARCHITECTURE.md)
- [AWS Setup Guide](docs/AWS_SETUP.md)

## Author

Khang Nguyen
