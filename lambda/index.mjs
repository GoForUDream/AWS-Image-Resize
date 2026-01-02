import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3Client = new S3Client({});
const RESIZED_BUCKET = process.env.RESIZED_BUCKET;
const RESIZE_WIDTHS = process.env.RESIZE_WIDTHS?.split(',').map(Number) || [150, 320, 640, 1024];

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing: ${bucket}/${key}`);

    try {
      // Get the original image from S3
      const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await s3Client.send(getCommand);
      const imageBuffer = Buffer.from(await response.Body.transformToByteArray());

      // Get original image metadata
      const metadata = await sharp(imageBuffer).metadata();
      console.log(`Original size: ${metadata.width}x${metadata.height}`);

      // Extract filename without extension and path
      const filename = key.split('/').pop().replace(/\.[^/.]+$/, '');

      // Resize to each width
      for (const width of RESIZE_WIDTHS) {
        // Calculate height maintaining aspect ratio
        const height = Math.round((width / metadata.width) * metadata.height);

        console.log(`Resizing to ${width}x${height}`);

        const resizedBuffer = await sharp(imageBuffer)
          .resize(width, height, { fit: 'inside' })
          .jpeg({ quality: 85 })
          .toBuffer();

        // Upload resized image
        const resizedKey = `resized/${filename}_${width}x${height}.jpg`;
        const putCommand = new PutObjectCommand({
          Bucket: RESIZED_BUCKET,
          Key: resizedKey,
          Body: resizedBuffer,
          ContentType: 'image/jpeg',
          Metadata: {
            'original-key': key,
            'original-width': String(metadata.width),
            'original-height': String(metadata.height),
          },
        });

        await s3Client.send(putCommand);
        console.log(`Uploaded: ${resizedKey}`);
      }

      console.log(`Successfully processed: ${key}`);
    } catch (error) {
      console.error(`Error processing ${key}:`, error);
      throw error;
    }
  }

  return { statusCode: 200, body: 'Processing complete' };
};
