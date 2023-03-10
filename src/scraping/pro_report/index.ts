import { sleep } from '../../utils/timeout';
import proReportService from '../../services/pro_report.service';
import AbstractScraper from '../abstract_scraper';

export default class ProReport extends AbstractScraper {
  private league: string;
  private filter: string;
  public url = 'https://www.actionnetwork.com/sharp-report';

  public async getData() {
    const leagues = ['nfl', 'ncaaf', 'nba', 'ncaab', 'nhl', 'mlb'];
    const leagueSelector =
      'div.odds-tools-sub-nav__primary-filters > div:nth-child(1) > select';
    const filters = ['spread', 'total', 'ml'];
    const filterSelector =
      'div.odds-tools-sub-nav__primary-filters > div:nth-child(2) > select';

    for (let i = 0; i < leagues.length; i++) {
      const league = leagues[i];
      await this.page.select(leagueSelector, league);
      this.league = league;

      let k = 0;
      while (k < 7) {
        for (let j = 0; j < filters.length; j++) {
          const filter = filters[j];
          await this.page.select(filterSelector, filter);
          this.filter = filter;
          console.log('fetched bet data');
          await this.parseData();
          await sleep(5000);
        }

        const nextElement = await this.page.$(
          'button[aria-label="Next Date"]',
        );
        if (nextElement) {
          await this.page.click('button[aria-label="Next Date"]');
          await this.page.waitForNetworkIdle();
          console.log('--- go to next page ---');
          k++;
        } else {
          console.log('--- go to next league or filter ---');
          break;
        }
      }
    }

    await this.page.close();
    await this.browser.close();
  }

  private async parseData() {
    let betDateXpath = '//span[@class="day-nav__display"]';
    const [betDateElement] = await this.page.$x(betDateXpath);
    const betDate = betDateElement
      ? await betDateElement.evaluate((el: HTMLElement) =>
          el.textContent?.trim(),
        )
      : '';
    const matchDataXpath = `//div[contains(@class, "sharp-report__game-info")]//parent::td//parent::tr`;
    const matchElements = await this.page.$x(matchDataXpath);
    for (let i = 0; i < matchElements.length; i++) {
      const element = matchElements[i];
      const homeOpenPoint = await element.evaluate(
        (el: HTMLElement) => {
          try {
            return el.children[1].children[0].children[0].textContent?.trim();
          } catch (error) {
            console.log(
              `error in ${this.league} & ${this.filter} & ProReport ==== `,
              error,
            );
            return '';
          }
        },
      );
      if (homeOpenPoint === '') break;

      const matchURL = await element.evaluate((el: HTMLElement) =>
        el.children[0].children[0].children[1].getAttribute('href'),
      );
      const matchDetailURL = 'https://www.actionnetwork.com' + matchURL;
      const detailPage = await this.browser.newPage();
      await detailPage.setDefaultNavigationTimeout(60000);
      await detailPage.goto(matchDetailURL, {
        waitUntil: 'networkidle2',
      });
      const matchDateXpath =
        '//div[contains(@class, "game-odds__date-container")]/span';
      const [matchDateElement] = await detailPage.$x(matchDateXpath);
      const matchDate = matchDateElement
        ? await matchDateElement.evaluate((el: HTMLElement) =>
            el.textContent?.trim(),
          )
        : '';

      const matchId = matchURL.match(/[a-zA-Z0-9]*$/)[0];
      await detailPage.close();

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (
        matchDate &&
        yesterday.getTime() < new Date(matchDate).getTime()
      ) {
        const homeTeam = await element.evaluate((el: HTMLElement) => {
          try {
            return el.children[0].children[0].children[1].children[0].children[0].children[1].children[0].textContent?.trim();
          } catch (error) {
            console.log(
              `error in ${this.league} & ${this.filter} & ProReport ==== `,
              error,
            );
            return '';
          }
        });
        const awayTeam = await element.evaluate((el: HTMLElement) => {
          try {
            return el.children[0].children[0].children[1].children[1].children[0].children[1].children[0].textContent?.trim();
          } catch (error) {
            console.log(
              `error in ${this.league} & ${this.filter} & ProReport ==== `,
              error,
            );
            return '';
          }
        });

        const homeOpenPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              return el.children[1].children[0].children[0].textContent?.trim();
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & ProReport ==== `,
                error,
              );
              return '';
            }
          },
        );
        const awayOpenPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              return el.children[1].children[0].children[1].textContent?.trim();
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & ProReport ==== `,
                error,
              );
              return '';
            }
          },
        );

        const homeBetsPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const str =
                el.children[8].children[0].children[0].textContent?.trim();
              if (str === 'N/A') {
                return '';
              } else {
                return str;
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & ProReport ==== `,
                error,
              );
              return '';
            }
          },
        );

        const awayBetsPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const str =
                el.children[8].children[0].children[1].textContent?.trim();
              if (str === 'N/A') {
                return '';
              } else {
                return str;
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & ProReport ==== `,
                error,
              );
              return '';
            }
          },
        );

        const betData = [
          {
            team: homeTeam,
            open: homeOpenPoint,
            bets: homeBetsPoint,
          },
          {
            team: awayTeam,
            open: awayOpenPoint,
            bets: awayBetsPoint,
          },
        ];

        await sleep(3000);

        await proReportService.updateProReport({
          league: this.league,
          filter: this.filter,
          matchId,
          matchDate,
          betDate,
          bet: JSON.stringify(betData),
        });
      }
    }
  }
}
