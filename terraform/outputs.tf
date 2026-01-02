output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_stage.main.invoke_url
}

output "uploads_bucket" {
  description = "S3 bucket for original uploads"
  value       = aws_s3_bucket.uploads.id
}

output "resized_bucket" {
  description = "S3 bucket for resized images"
  value       = aws_s3_bucket.resized.id
}

output "lambda_function" {
  description = "Lambda function name for resizing"
  value       = aws_lambda_function.resize.function_name
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain for resized images"
  value       = aws_cloudfront_distribution.resized.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.resized.id
}
