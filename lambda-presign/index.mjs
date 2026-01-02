import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({});
const UPLOADS_BUCKET = process.env.UPLOADS_BUCKET;
const RESIZED_BUCKET = process.env.RESIZED_BUCKET;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { routeKey, pathParameters, queryStringParameters, body, rawPath } = event;

  try {
    // POST /presign/upload - Generate upload URL
    if (routeKey === 'POST /presign/upload') {
      const { filename, contentType } = JSON.parse(body || '{}');

      if (!filename) {
        return response(400, { error: 'filename is required' });
      }

      const key = `uploads/${Date.now()}-${filename}`;
      const command = new PutObjectCommand({
        Bucket: UPLOADS_BUCKET,
        Key: key,
        ContentType: contentType || 'image/jpeg',
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

      return response(200, {
        uploadUrl,
        key,
        expiresIn: 300,
      });
    }

    // GET /presign/download - Generate download URL for resized image
    // Supports both path parameter and query parameter
    if (routeKey === 'GET /presign/download/{key}' || rawPath?.startsWith('/presign/download')) {
      const key = pathParameters?.key
        ? decodeURIComponent(pathParameters.key)
        : queryStringParameters?.key
          ? decodeURIComponent(queryStringParameters.key)
          : null;

      if (!key) {
        return response(400, { error: 'key is required' });
      }

      // Use CloudFront URL if available, otherwise fall back to S3 presigned URL
      let downloadUrl;
      if (CLOUDFRONT_DOMAIN) {
        downloadUrl = `https://${CLOUDFRONT_DOMAIN}/${key}`;
      } else {
        const command = new GetObjectCommand({
          Bucket: RESIZED_BUCKET,
          Key: key,
        });
        downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      }

      return response(200, {
        downloadUrl,
        expiresIn: CLOUDFRONT_DOMAIN ? null : 3600,
        cdn: !!CLOUDFRONT_DOMAIN,
      });
    }

    // GET /status - Check if resized images are ready
    // Supports both path parameter and query parameter
    if (routeKey === 'GET /status/{key}' || routeKey === 'GET /status') {
      const originalKey = pathParameters?.key
        ? decodeURIComponent(pathParameters.key)
        : queryStringParameters?.key
          ? decodeURIComponent(queryStringParameters.key)
          : null;

      if (!originalKey) {
        return response(400, { error: 'key is required' });
      }

      const filename = originalKey.split('/').pop().replace(/\.[^/.]+$/, '');

      // List resized images for this file
      const listCommand = new ListObjectsV2Command({
        Bucket: RESIZED_BUCKET,
        Prefix: `resized/${filename}_`,
      });

      const listResponse = await s3Client.send(listCommand);
      const resizedImages = listResponse.Contents || [];

      if (resizedImages.length === 0) {
        return response(200, {
          status: 'processing',
          message: 'Images are still being processed',
          images: [],
        });
      }

      // Generate download URLs for all resized images
      const images = await Promise.all(
        resizedImages.map(async (obj) => {
          let downloadUrl;

          // Use CloudFront URL if available
          if (CLOUDFRONT_DOMAIN) {
            downloadUrl = `https://${CLOUDFRONT_DOMAIN}/${obj.Key}`;
          } else {
            const command = new GetObjectCommand({
              Bucket: RESIZED_BUCKET,
              Key: obj.Key,
            });
            downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          }

          // Extract dimensions from filename
          const match = obj.Key.match(/_(\d+)x(\d+)\./);
          const width = match ? parseInt(match[1]) : 0;
          const height = match ? parseInt(match[2]) : 0;

          return {
            key: obj.Key,
            downloadUrl,
            width,
            height,
            size: obj.Size,
          };
        })
      );

      return response(200, {
        status: 'complete',
        message: 'Images are ready',
        images: images.sort((a, b) => a.width - b.width),
        cdn: !!CLOUDFRONT_DOMAIN,
      });
    }

    return response(404, { error: 'Not found', routeKey, rawPath });
  } catch (error) {
    console.error('Error:', error);
    return response(500, { error: error.message });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}
