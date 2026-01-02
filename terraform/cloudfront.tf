# Origin Access Control for CloudFront to access S3
resource "aws_cloudfront_origin_access_control" "resized" {
  name                              = "${var.project_name}-oac"
  description                       = "OAC for resized images bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Response headers policy for CORS
resource "aws_cloudfront_response_headers_policy" "cors" {
  name    = "${var.project_name}-cors-policy"
  comment = "CORS policy for image downloads"

  cors_config {
    access_control_allow_credentials = false

    access_control_allow_headers {
      items = ["*"]
    }

    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS"]
    }

    access_control_allow_origins {
      items = ["*"]
    }

    access_control_expose_headers {
      items = ["Content-Length", "Content-Type"]
    }

    access_control_max_age_sec = 3600
    origin_override            = true
  }
}

# CloudFront distribution for resized images
resource "aws_cloudfront_distribution" "resized" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CDN for resized images"
  default_root_object = ""
  price_class         = "PriceClass_100" # Use only North America and Europe (cheapest)

  origin {
    domain_name              = aws_s3_bucket.resized.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.resized.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.resized.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${aws_s3_bucket.resized.id}"

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
      cookies {
        forward = "none"
      }
    }

    response_headers_policy_id = aws_cloudfront_response_headers_policy.cors.id
    viewer_protocol_policy     = "redirect-to-https"
    min_ttl                    = 0
    default_ttl                = 86400    # 1 day
    max_ttl                    = 31536000 # 1 year
    compress                   = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project_name}-cdn"
  }
}

# S3 bucket policy to allow CloudFront access
resource "aws_s3_bucket_policy" "resized" {
  bucket = aws_s3_bucket.resized.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontAccess"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.resized.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.resized.arn
          }
        }
      }
    ]
  })
}
