const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const maxAttempts = 10;
const Attributes = process.argv.splice(2);
const viewport = {width: 1980, height: 1980};
const foldNames = ['puppeteer-screenshot', 'puppeteer-errorlog'];
const imgPrefix = '../../';

const createFolders = async () => {
  for (const foldName of foldNames) {
    const folderPath = `${imgPrefix}${foldName}`;
    try {
      await fs.mkdir(folderPath);
      console.log(`create ${foldName} Folder`);
    } catch (error) {
      console.log(`${foldName} Folder already exists`);
    }
  }
};

const getConfigData = async () => {
  let urls = [];
  if (!Attributes.length) {
    console.log(`missing instruction. \r\n Please refer to the readme file`);
    return;
  }
  if (Attributes[0] === 'single') {
    urls = [{
      "url": Attributes[1],
    }];
  }
  if (Attributes[0] === 'batch') {
    const configUrl = Attributes[1];
    const rawdata = await fs.readFile(configUrl);
    urls = JSON.parse(rawdata);
  }
  return urls;
};

const processUrl = async (browser, url, i) => {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  for (let j = 0; j < maxAttempts; j++) {
    try {
      console.log(`visiting ${url.url}...`);
      await page.goto(url.url, {waitUntil: 'networkidle2', timeout: 30000 });
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.setViewport({ width: 1920, height });
      await page.screenshot({ path: `${imgPrefix}${foldNames[0]}/before${i}.png`,fullPage: true });
      break;
    } catch (e) {
      console.warn(`Attempt ${j + 1} failed for ${url.url}: ${e}`);
      if (j === maxAttempts - 1) {
        await fs.appendFile(`${imgPrefix}${foldNames[1]}/error.json`, JSON.stringify(url.url));
        throw new Error(`Failed to process URL after ${maxAttempts} attempts`);
      }
    }
  }
  await page.close();
};
console.log('turning on...');

(async () => {
  const urls = await getConfigData();
  if(!urls.length) {
    console.log(`missing instruction. \r\n Please refer to the readme file`);
    return;
  }
  const browser = await puppeteer.launch({ headless: 'new', dumpio: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
