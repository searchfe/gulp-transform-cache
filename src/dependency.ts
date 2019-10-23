import { readdirSync, readFileSync, statSync, unlinkSync, existsSync } from 'fs';
import { extname, resolve } from 'path';
import { getNameByInfo } from './hash';

export function updateAll(){
  if (process.env.build_cache === "open") {
    const start = new Date().getTime();
    const cacheRoot = resolve(__dirname, '.cache');
    if (existsSync(cacheRoot)) {
      readdirSync(cacheRoot).forEach(dir => {
        update(cacheRoot + '/' + dir);
      });
    }
    console.log('finish update deps:', new Date().getTime() - start , 'ms');
  }
}

export function update(cacheDir: string) {
  const fileList = readdirSync(cacheDir);
  const delList: string[] = [];
  fileList.forEach(fileName => {
    if (extname(fileName) === ".info") {
      const path = cacheDir + '/' + fileName;
      if(!checkInfo(path)) {
        delList.push(path);
        console.log("Time Diff : ", readFileSync(path).toString().split('\n')[0]);
      } else {
        const depPath = path.substring(0, path.length - ".info".length) + ".deps";

        if(!checkDep(depPath, cacheDir)){
          delList.push(path);
          console.log("Deps Diff : ", readFileSync(path).toString().toString().split('\n')[0]);
        }
      }
    }
  });
  delList.forEach(item => {
    del(item);
  });
}

function checkInfo(filePath: string) {
  const info = readFileSync(filePath).toString().split('\n');
  if (statSync(info[0]).mtimeMs !== parseFloat(info[1])) {
    // info 里的时间戳和 缓存里不一致
    return false;
  }
  return true;
}

function checkDep(depPath: string, cacheDir: string) {
  if (existsSync(depPath)) {
    const deps = readFileSync(depPath).toString().split('\n');
    let same = true;
    deps.forEach(line => {
      if (!same) {
        // 已经diff就继续
        return;
      }
      const dep = line.split('\t');
      if (line.length === 0) {
        return;
      }
      if (!existsSync(dep[0])) {
        // 物理不存在
        same = false;
      } else if (statSync(dep[0]).mtimeMs !== parseFloat(dep[1])) {
        // 物理依赖已经不一致
        same = false;
      } else {
        // 物理一致要接受嵌入的校验
        const depTarget = getNameByInfo(dep[0], parseFloat(dep[1]));
        // if (!existsSync(cacheDir + '/' + depTarget + '.info')) {
        //   // info 都没了说明已经干掉了 不用分析了
        //   console.log('-->', false, cacheDir + '/' + depTarget + '.info', dep[0], dep[1]);
        //   same = false;
        // } else
        if (!checkDep(cacheDir + '/' + depTarget + '.deps', cacheDir)) {
          // console.log('===>', false);
          same = false;
        }
      }
    });
    return same;
  } else {
    return true;
  }
}


function del(fileInfoPath: string) {
  const prefix = fileInfoPath.substring(0, fileInfoPath.length - ".info".length);
  unlinkSync(fileInfoPath);
  delSync(prefix + '.deps');
  delSync(prefix + '.link');
  delSync(prefix + '.pass');
  delSync(prefix + '.cache');
}

function delSync(filePath: string) {
  if(existsSync(filePath)) {
    unlinkSync(filePath);
  }
}
