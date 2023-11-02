const fs = require('fs');
const PNG = require('pngjs').PNG;
const sharp = require('sharp');
const pixelmatch = require('pixelmatch');

// 读取两个本地图片
const image1Path = 'after.png';
const image2Path = 'before.png';

// 将两个图像缩放到相同的尺寸
sharp(image1Path)
  .resize({ width: 1920, height: 11135 }) // 设置目标尺寸
  .toFile('resized_image1.png')
  .then(() => {
    sharp(image2Path)
      .resize({ width: 1920, height: 11135 }) // 设置目标尺寸
      .toFile('resized_image2.png')
      .then(() => {
        // 读取缩放后的图像
        const img1 = PNG.sync.read(fs.readFileSync('resized_image1.png'));
        const img2 = PNG.sync.read(fs.readFileSync('resized_image2.png'));

        // 创建一个与图片大小相同的空白图像用于存储差异
        const diff = new PNG({ width: img1.width, height: img1.height });

        // 进行像素级别的比较
        const numDiffPixels = pixelmatch(
          img1.data,
          img2.data,
          diff.data,
          img1.width,
          img1.height,
          { threshold: 0.1 }
        );

        // 将差异图像保存到本地
        diff.pack().pipe(fs.createWriteStream('diff.png'));

        console.log(`差异像素数: ${numDiffPixels}`);
      })
      .catch((error) => console.error(error));
  })
  .catch((error) => console.error(error));
