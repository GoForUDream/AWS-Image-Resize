variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "image-resizer"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "resize_widths" {
  description = "List of widths to resize images to"
  type        = list(number)
  default     = [150, 320, 640, 1024]
}
