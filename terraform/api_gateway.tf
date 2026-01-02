# API Gateway REST API
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"] # Restrict in production
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 3600
  }
}

# API Gateway stage
resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
    })
  }
}

# CloudWatch log group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}"
  retention_in_days = 14
}

# Lambda integration for presign
resource "aws_apigatewayv2_integration" "presign" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.presign.invoke_arn
  payload_format_version = "2.0"
}

# Route: POST /presign/upload
resource "aws_apigatewayv2_route" "presign_upload" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /presign/upload"
  target    = "integrations/${aws_apigatewayv2_integration.presign.id}"
}

# Route: GET /presign/download/{key}
resource "aws_apigatewayv2_route" "presign_download" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /presign/download/{key}"
  target    = "integrations/${aws_apigatewayv2_integration.presign.id}"
}

# Route: GET /status/{key} (legacy, for path parameter)
resource "aws_apigatewayv2_route" "status" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /status/{key}"
  target    = "integrations/${aws_apigatewayv2_integration.presign.id}"
}

# Route: GET /status (for query parameter)
resource "aws_apigatewayv2_route" "status_query" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /status"
  target    = "integrations/${aws_apigatewayv2_integration.presign.id}"
}

# Allow API Gateway to invoke Lambda
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.presign.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
