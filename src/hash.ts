import { File } from './types';
import * as crypto from 'crypto';

export function getName(file: File, path?: string) {
  if (file._cacheMd5 === undefined) {
    const md5sum = crypto.createHash('md5');
    md5sum.update((path || file.path) + file.stat.mtimeMs, 'utf8');
    file._cacheMd5 = md5sum.digest('hex').substring(0,32);
  }
  return file._cacheMd5;
}

export function getNameByInfo(path: string, mtimeMs: number) {
  const md5sum = crypto.createHash('md5');
  md5sum.update(path + mtimeMs, 'utf8');
  return md5sum.digest('hex').substring(0,32);
}
