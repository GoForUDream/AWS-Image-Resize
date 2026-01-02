# AWS Setup Guide

## Prerequisites

- AWS account ([Create free](https://aws.amazon.com/free/))
- macOS with Homebrew (or equivalent)

## 1. Install Tools

```bash
# AWS CLI
brew install awscli

# Terraform
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Docker (required for Apple Silicon)
brew install --cask docker
```

## 2. Create IAM User

1. Go to [AWS Console](https://console.aws.amazon.com/) → **IAM** → **Users** → **Create user**
2. Name: `terraform-user`
3. Attach policies:
   - `AmazonS3FullAccess`
   - `AWSLambda_FullAccess`
   - `IAMFullAccess`
   - `AmazonAPIGatewayAdministrator`
   - `CloudFrontFullAccess`
   - `CloudWatchLogsFullAccess`
4. Create user → **Security credentials** → **Create access key** → **CLI**
5. Save both keys

## 3. Configure AWS CLI

```bash
aws configure
# Enter: Access Key, Secret Key, us-east-1, json
```

Verify:
```bash
aws sts get-caller-identity
```

## 4. Deploy

```bash
# Build Lambda dependencies (Apple Silicon)
cd lambda
docker run --rm --entrypoint "" -v "$PWD":/var/task -w /var/task \
  public.ecr.aws/lambda/nodejs:20 npm install
cd ..

# Install presign Lambda
cd lambda-presign && npm install && cd ..

# Deploy
cd terraform
terraform init
terraform apply
```

## Troubleshooting

**"Could not load sharp module"**
```bash
cd lambda && rm -rf node_modules
docker run --rm --entrypoint "" -v "$PWD":/var/task -w /var/task \
  public.ecr.aws/lambda/nodejs:20 npm install
```

**Multiple AWS profiles**
```bash
export AWS_PROFILE=your-profile
terraform apply
```
