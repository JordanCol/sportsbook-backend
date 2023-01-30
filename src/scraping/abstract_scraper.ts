import puppeteer, { Browser, Page } from 'puppeteer';

export default abstract class AbstractScraper {
  public browser: Browser;
  public page: Page;
  public url: string;

  abstract getData(): void;

  public async openBrowser() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    let i = 0;
    while (i < 5) {
      try {
        await page.setDefaultNavigationTimeout(120000);
        await page.goto(this.url, { waitUntil: 'networkidle2' });
        this.browser = browser;
        this.page = page;
        break;
      } catch (error) {
        i++;
      }
    }
  }

  public async start() {
    await this.openBrowser();
    await this.getData();
  }

  public async stop() {
    await this.page.close();
    await this.browser.close();
  }
}
