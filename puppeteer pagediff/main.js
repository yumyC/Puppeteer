const puppeteer = require('puppeteer');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const fs = require('fs');

const maxAttempts = 10;
const Attributes = process.argv.splice(2);
const viewport = {width: 1980, height: 1980};
const foldNames = ['diff-Images', 'diff-screenshot', 'diff-errorlog'];
const imgPrefix = '../../';

const createFolders = (() => {
  foldNames.forEach(foldName => {
    const folderPath = `${imgPrefix}${foldName}`;
    if (!fs.existsSync(folderPath)) {
      console.log(`create ${foldName} Folder`);
      fs.mkdirSync(folderPath);
    } else {
      console.log(`${foldName} Folder already exists`);
    }
  });
});

const getConfigData = (() => {
  let urls = [];
  if (!Attributes.length) {
    console.log(`missing instruction. \r\n Please refer to the readme file`);
    return;
  }
  if (Attributes[0] === 'single') {
    urls = [{
      "beforeUrl": Attributes[1],
      "afterUrl": Attributes[2]
    }]
  }
  if (Attributes[0] === 'batch') {
    const configUrl = Attributes[1];
    const rawdata = fs.readFileSync(configUrl);
    urls = JSON.parse(rawdata).batchData;
  }
  return urls;
});

async function processUrl(browser, url, i) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  for (let j = 0; j < maxAttempts; j++) {
    try {
      console.log(`visiting${url.beforeUrl}...`);
      await page.goto(url.beforeUrl, {waitUntil: 'networkidle2', timeout: 10000 });
      const screenshot = await page.screenshot({ path: `${imgPrefix}${foldNames[1]}/before${i}.png` });
      console.log(`visiting${url.afterUrl}...`);
      // 自定义更改dom结构
      // await page.waitForSelector('#disclaimer-bar');
      // await page.evaluate(() => {
      //   const disclaimer = document.querySelector('#disclaimer-bar');
      //   if (disclaimer) {
      //     disclaimer.parentNode.removeChild(disclaimer);
      //   }
      //   const header = document.querySelector('.has-disclaimer');
      //   if (header) {
      //   header.style.paddingTop = '0px';
      //   }
      // });
      await page.goto(url.afterUrl, {waitUntil: 'networkidle2', timeout: 10000 });
      const screenshot2 = await page.screenshot({ path: `${imgPrefix}${foldNames[1]}/after${i}.png` });
      await diffImage(screenshot, screenshot2, `${url.beforeUrl} and ${url.afterUrl}`);
      break; // 如果没有错误，那么退出循环
    } catch (e) {
      console.warn(`Attempt ${j + 1} failed for ${url.beforeUrl} and ${url.afterUrl}: ${e}`);
      if (j === maxAttempts - 1) { // 如果这是最后一次尝试，那么抛出错误
        fs.appendFileSync(`${imgPrefix}${foldNames[2]}/error.json`, JSON.stringify(url));
        throw new Error(`Failed to process URL after ${maxAttempts} attempts`);
      }
    }
  }
  await page.close();
}
function diffImage(screenshot1, screenshot2, url) {
  console.log(`open compare ${url}`);
  const img1 = PNG.sync.read(screenshot1);
  const img2 = PNG.sync.read(screenshot2);

  const diff = new PNG({ width: img1.width, height: img1.height });

  const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: 0.1 });

  fs.writeFileSync(`${imgPrefix}${foldNames[0]}/${url.replace(/\//g, "_")}.png`, PNG.sync.write(diff));

  console.log(`Number of difference pixels: ${numDiffPixels}`);
}
console.log('turning on...');
(async () => {
  const urls = await getConfigData();
  if(!urls?.length) {
    console.log(`missing instruction. \r\n Please refer to the readme file`);
    return;
  }
  const browser = await puppeteer.launch({ headless: 'new', dumpio: false });
  await createFolders();
  try {
    await Promise.all(urls.map((url, i) => processUrl(browser, url, i)));
    console.log('All URLs have been processed successfully');
  } catch (e) {
    console.error(`Failed to process URLs: ${e}`);
  } finally {
    await browser.close();
  }
})();
