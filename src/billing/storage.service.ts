
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir = path.join(process.cwd(), 'public', 'invoices');

  constructor() {
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(filename: string, content: Buffer): Promise<string> {
    const filePath = path.join(this.uploadDir, filename);
    await fs.promises.writeFile(filePath, content);
    // Return relative URL assuming 'public' is served statically
    return `/invoices/${filename}`;
  }
  
  getFilePath(filename: string): string {
      return path.join(this.uploadDir, filename);
  }

  async getFile(filename: string): Promise<Buffer> {
      const filePath = path.join(this.uploadDir, filename);
      if (!fs.existsSync(filePath)) {
          throw new Error('File not found');
      }
      return fs.promises.readFile(filePath);
  }
  
  // Placeholder for GCS implementation
  async saveToCloud(filename: string, content: Buffer): Promise<string> {
      // TODO: Implement GCS upload
      return this.saveFile(filename, content);
  }
}
