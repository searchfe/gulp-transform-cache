import { resolve } from 'path';
import { File } from './types';
import { existsSync, writeFileSync, readFileSync, statSync } from 'fs';
import * as crypto from 'crypto';
import { removeSync, mkdirpSync } from 'fs-extra';

export class Cache {
  public dir: string;
  public setKey(key: string) {
    // 工作路径
    this.dir = resolve(__dirname, '.cache', key || 'temp');
    mkdirpSync(this.dir);
  }

  getPass(file): boolean {
    const cacheDir = this.getFolder(file);
    if (existsSync(cacheDir + '.pass')) {
      return true;
    }
    return false;
  }

  getCache(file: File): File | undefined {
    const cacheDir = this.getFolder(file);
    if (!existsSync(cacheDir + '.cache')) {
      return;
    }
    if (existsSync(cacheDir + '.deps')) {
      let diff = false;
      readFileSync(cacheDir + '.deps').toString().split('\r').forEach(line => {
        const arr = line.split('\t');
        if (diff === false && arr.length === 2) {
          if (existsSync(arr[0]) && statSync(arr[0]).mtimeMs.toString() === arr[1]) {
            // 符合
          } else {
            diff = true;
          }
        }
      });
      if (diff) {
        return;
      }
    }
    file.contents = readFileSync(cacheDir + '.cache');
    return file;
  }

  passCache(file: File) {
    if (file && file.stat && file.stat.mtimeMs) {
      const cacheDir = this.getFolder(file);
      writeFileSync(cacheDir + '.pass', '');
      writeFileSync(cacheDir + '.info', `${file.path}\r${file.stat.mtimeMs}\r`);
    }
  }
  saveCache(file: File) {
    if (file && file.stat && file.stat.mtimeMs) {
      const cacheDir = this.getFolder(file);
      if (file.depFiles) {
        let error = false;
        let depinfo = '';
        file.depFiles.forEach(dep => {
          if (existsSync(dep)) {
            const stat = statSync(dep);
            depinfo +=`${dep}\t${stat.mtimeMs}\r`;
          } else {
            error = true;
          }
        });
        if (error) {
          return;
        }
        writeFileSync(cacheDir + '.deps', depinfo);
      }
      writeFileSync(cacheDir + '.cache', file.contents);
      writeFileSync(cacheDir + '.info', `${file.path}\r${file.stat.mtimeMs}\r`);
    }
  }

  getFolder(file: File) {
    if (file._cacheMd5 === undefined) {
      let md5sum = crypto.createHash('md5');
      md5sum.update(file.path + file.stat.mtimeMs, 'utf8');
      file._cacheMd5 = md5sum.digest('hex').substring(0,32);
    }
    return this.dir + '/' + file._cacheMd5;
  }

  proxy(t: transform) {
    if (process.env.build_cache === "open") {
      return (file: File, enc, callback: Callback) => {
        if (this.getPass(file)) {
          // 上次无处理 且mtime不变
          callback(null, file);
          return;
        }
        const newFile = this.getCache(file);
        const oldBuffer = file.contents;
        if (newFile) {
          callback(null, newFile);
        } else {
          // t是业务的回调
          // callback是pipe的回调
          t(file, enc, (buffer, nfile) => {
            // 业务进行了回调
            if (nfile.path === file.path) {
              if (oldBuffer === nfile.contents && !nfile.depFiles) {
                // 没有变化 标记无处理
                this.passCache(nfile);
              } else {
                this.saveCache(nfile);
              }
              callback(null, nfile);
            }
          });
        }
      }
    } else {
      return t;
    }
  }

  static clearAll() {
    removeSync(resolve(__dirname, '.cache'));
  }
}

type transform = (file: File, enc, callback) => void;
type Callback =  (buffer: any, file: File) => void;

/**
 *     传递
 *     改变
 *     不callback
 *     旁路
 */
