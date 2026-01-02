# Package Lambda function code
data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/lambda.zip"
}

# Lambda function for image resizing
resource "aws_lambda_function" "resize" {
  filename         = data.archive_file.lambda.output_path
  function_name    = "${var.project_name}-resize"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 512
  architectures    = ["arm64"]  # Use Graviton2 (ARM) - 20% cheaper, matches Apple Silicon builds

  environment {
    variables = {
      RESIZED_BUCKET = aws_s3_bucket.resized.id
      RESIZE_WIDTHS  = join(",", var.resize_widths)
    }
  }
}

# Allow S3 to invoke Lambda
resource "aws_lambda_permission" "s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.resize.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.uploads.arn
}

# CloudWatch log group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.resize.function_name}"
  retention_in_days = 14
}

# Lambda for generating presigned URLs
data "archive_file" "presign" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda-presign"
  output_path = "${path.module}/lambda-presign.zip"
}

resource "aws_lambda_function" "presign" {
  filename         = data.archive_file.presign.output_path
  function_name    = "${var.project_name}-presign"
  role             = aws_iam_role.lambda_presign.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.presign.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      UPLOADS_BUCKET    = aws_s3_bucket.uploads.id
      RESIZED_BUCKET    = aws_s3_bucket.resized.id
      CLOUDFRONT_DOMAIN = aws_cloudfront_distribution.resized.domain_name
    }
  }
}

# IAM role for presign Lambda
resource "aws_iam_role" "lambda_presign" {
  name = "${var.project_name}-presign-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_presign" {
  name = "${var.project_name}-presign-policy"
  role = aws_iam_role.lambda_presign.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          "${aws_s3_bucket.uploads.arn}/*",
          "${aws_s3_bucket.resized.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.resized.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "presign" {
  name              = "/aws/lambda/${aws_lambda_function.presign.function_name}"
  retention_in_days = 14
}
