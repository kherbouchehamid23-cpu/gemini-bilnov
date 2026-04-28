import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('STORAGE_BUCKET', 'bilnov-files');

    this.s3 = new S3Client({
      endpoint: config.get<string>('STORAGE_ENDPOINT'),
      region: config.get<string>('STORAGE_REGION', 'auto'),
      credentials: {
        accessKeyId: config.get<string>('STORAGE_ACCESS_KEY', ''),
        secretAccessKey: config.get<string>('STORAGE_SECRET_KEY', ''),
      },
      forcePathStyle: config.get('NODE_ENV') !== 'production',
    });
  }

  /**
   * Upload un fichier vers S3/R2/MinIO
   * RÈGLE : Ne jamais exposer storageKey directement — toujours via generateSignedUrl
   */
  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    organizationId: string,
    projectId: string,
  ): Promise<{ storageKey: string; sizeBytes: number }> {
    const ext = path.extname(originalName).toLowerCase();
    const storageKey = `${organizationId}/${projectId}/${randomUUID()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: mimeType,
        ContentLength: buffer.length,
      }),
    );

    this.logger.log(`Uploaded: ${storageKey} (${buffer.length} bytes)`);

    return { storageKey, sizeBytes: buffer.length };
  }

  /**
   * Génère une URL signée temporaire (pre-signed URL)
   * SÉCURITÉ : Vérifier les permissions AVANT d'appeler cette méthode
   */
  async generateSignedUrl(
    storageKey: string,
    purpose: 'view' | 'download',
    filename?: string,
  ): Promise<{ url: string; expiresAt: Date }> {
    const ttlSeconds = purpose === 'view' ? 3600 : 300;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ...(purpose === 'download' && filename
        ? { ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"` }
        : {}),
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: ttlSeconds });

    return {
      url,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  }

  /**
   * Supprime un fichier du storage
   */
  async delete(storageKey: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
    this.logger.log(`Deleted: ${storageKey}`);
  }

  /**
   * Vérifie si un fichier existe
   */
  async exists(storageKey: string): Promise<boolean> {
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey }));
      return true;
    } catch {
      return false;
    }
  }
}
