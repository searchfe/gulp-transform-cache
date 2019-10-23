import { readFileSync, readdirSync } from 'fs';
import * as gulp from 'gulp';
import { removeSync } from 'fs-extra';
import { resolve as r } from 'path';
import { File } from '../src/types';
import { Cache } from '../src/cache';
import { updateAll } from '../src/dependency';
import { Transform } from '../src/transform';
import { Transform as Pipe } from "readable-stream";

const root = __dirname;
const fileName = 'origin.withcache.js';
const cacheDir = r(__dirname, '../src/.cache');
const newBuffer = new Buffer('var test = "911";');

// const content = readFileSync(filePath);
// const prefix = 'molecule';
updateAll();
describe('With Cache With change', () => {
    // 使用cache，这个管道产生变化（file.contents改变）
    // 测试1：产生cache，测试2：复用cache，测试3：因为mtime失效，不复用且生成新cache

  beforeAll(() => {
    removeSync(r(root, '../src/.cache/WithCache'));
    removeSync(`${root}\/dist/${fileName}`);
    process.env.build_cache = "open";
  });

  it('produce cache', () => {
    let deal = 0; // 处理计数
    class WithCache extends Transform {};
    const nocache = new WithCache({
      objectMode: true,
      transform: (file: File, enc, callback) => {
        // do nothing
        file.contents = newBuffer;
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
          const origin = newBuffer.toString();
          // console.log(code);
          // tslint:disable-next-line:no-eval
          // eval(code);
          console.log(code);
          expect(deal).toBe(1);
          expect(origin).toBe(code);
          //expect(existsSync(resolve(cacheDir, `WithCache/${File}`)));
          expect(readdirSync(r(cacheDir, `WithCache`)).join('|') + '|').toMatch(".cache|");
          resolve();
        },
      );
    });
    /** end */
  });


  it('use cache', () => {
    removeSync(`${root}\/dist/${fileName}`);
    let deal = 0; // 处理计数
    class WithCache extends Transform {};
    const nocache = new WithCache({
      objectMode: true,
      transform: (file: File, enc, callback) => {
        file.contents = newBuffer;
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
          const origin = newBuffer.toString();
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
    class WithCache extends Transform {};
    const nocache = new WithCache({
      objectMode: true,
      transform: (file: File, enc, callback) => {
        file.contents = newBuffer;
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
          const origin = newBuffer.toString();
          // console.log(code);
          // tslint:disable-next-line:no-eval
          // eval(code);
          console.log(code);
          expect(deal).toBe(1);
          expect(origin).toBe(code);
          expect(readdirSync(r(cacheDir, `WithCache`)).length).toBe(4);
          resolve();
        },
      );
    });
    /** end */
  });
});
