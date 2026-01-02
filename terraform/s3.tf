# S3 bucket for original uploaded images
resource "aws_s3_bucket" "uploads" {
  bucket = "${var.project_name}-uploads-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"] # Restrict in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 bucket for resized images
resource "aws_s3_bucket" "resized" {
  bucket = "${var.project_name}-resized-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_cors_configuration" "resized" {
  bucket = aws_s3_bucket.resized.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"] # Restrict in production
    max_age_seconds = 3000
  }
}

# Allow Lambda to be triggered by S3
resource "aws_s3_bucket_notification" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.resize.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
  }

  depends_on = [aws_lambda_permission.s3]
}
