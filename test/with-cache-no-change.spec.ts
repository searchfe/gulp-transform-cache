import { readFileSync, readdirSync } from 'fs';
import * as gulp from 'gulp';
import { removeSync } from 'fs-extra';
import { resolve as r } from 'path';
import { File } from '../src/types';
import { Cache } from '../src/cache';
import { Transform } from '../src/transform';
import { Transform as Pipe } from "readable-stream";

const root = __dirname;
const fileName = 'origin.nocache.js';
const cacheDir = r(__dirname, '../src/.cache');
// const content = readFileSync(filePath);
// const prefix = 'molecule';

describe('With Cache No change', () => {
    // 使用cache，但是这个管道不产生变化（file.contents不变），所以使用cache
    // 测试1：产生cache，测试2：复用cache，测试3：因为mtime失效，不复用且生成新cache

  beforeAll(() => {
    removeSync(r(root, '../src/.cache/NoChange'));
    removeSync(`${root}\/dist/${fileName}`);
    process.env.build_cache = "open";
  });

  it('produce cache', () => {
    let deal = 0; // 处理计数
    class NoChange extends Transform {};
    const nocache = new NoChange({
      objectMode: true,
      transform: (file: File, enc, callback) => {
        // do nothing
        callback(null, file);
        deal ++;
      }
    });

    return new Promise((resolve) => {

      /** start */
      gulp.src(
        `${root}\/assert/${fileName}`, {
        base: `${root}\/assert`,
      },
      ).pipe(nocache).pipe(
        gulp.dest(`${root}\/dist\/`),
      ).on('end',
        () => {
          const code = readFileSync(`${root}\/dist/${fileName}`).toString();
          const origin = readFileSync(`${root}\/assert/${fileName}`).toString();
          // console.log(code);
          // tslint:disable-next-line:no-eval
          // eval(code);
          console.log(code);
          expect(deal).toBe(1);
          expect(origin).toBe(code);
          //expect(existsSync(resolve(cacheDir, `NoChange/${File}`)));
          expect(readdirSync(r(cacheDir, `NoChange`)).join('|') + '|').toMatch(".pass|");
          resolve();
        },
      );
    });
    /** end */
  });


  it('use cache', () => {
    removeSync(`${root}\/dist/${fileName}`);
    let deal = 0; // 处理计数
    class NoChange extends Transform {};
    const nocache = new NoChange({
      objectMode: true,
      transform: (file: File, enc, callback) => {
        // do nothing
        callback(null, file);
        deal ++;
      }
    });

    return new Promise((resolve) => {

      /** start */
      gulp.src(
        `${root}\/assert/${fileName}`, {
        base: `${root}\/assert`,
      },
      ).pipe(nocache).pipe(
        gulp.dest(`${root}\/dist\/`),
      ).on('end',
        () => {
          const code = readFileSync(`${root}\/dist/${fileName}`).toString();
          const origin = readFileSync(`${root}\/assert/${fileName}`).toString();
          // console.log(code);
          // tslint:disable-next-line:no-eval
          // eval(code);
          console.log(code);
          expect(deal).toBe(0);
          expect(origin).toBe(code);
          resolve();
        },
      );
    });
    /** end */
  });


  it('file change', () => {
    removeSync(`${root}\/dist/${fileName}`);
    let deal = 0; // 处理计数
    class NoChange extends Transform {};
    const nocache = new NoChange({
      objectMode: true,
      transform: (file: File, enc, callback) => {
        // do nothing
        callback(null, file);
        deal ++;
      }
    });

    return new Promise((resolve) => {

      /** start */
      gulp.src(
        `${root}\/assert/${fileName}`, {
        base: `${root}\/assert`,
      },
      ).pipe(
        new Pipe({
          objectMode: true,
          transform: (file: File, enc, callback) => {
            file.stat.mtimeMs = new Date().getTime();
            callback(null, file);
          }
        })
      ).pipe(nocache).pipe(
        gulp.dest(`${root}\/dist\/`),
      ).on('end',
        () => {
          const code = readFileSync(`${root}\/dist/${fileName}`).toString();
          const origin = readFileSync(`${root}\/assert/${fileName}`).toString();
          // console.log(code);
          // tslint:disable-next-line:no-eval
          // eval(code);
          console.log(code);
          expect(deal).toBe(1);
          expect(origin).toBe(code);
          expect(readdirSync(r(cacheDir, `NoChange`)).length).toBe(4);
          resolve();
        },
      );
    });
    /** end */
  });
});
