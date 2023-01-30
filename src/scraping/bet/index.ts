import { sleep } from '../../utils/timeout';
import betService from '../../services/bet.service';
import AbstractScraper from '../abstract_scraper';

export default class Bet extends AbstractScraper {
  private league: string;
  private filter: string;
  public url = 'https://www.actionnetwork.com/odds';

  public async getData() {
    const leagues = [
      'nfl',
      'ncaaf',
      'nba',
      'ncaab',
      'nhl',
      'mlb',
      'soccer',
      'wnba',
      'ufc',
      'nascar',
      'atp',
      'wta',
    ];
    const leagueSelector =
      'div.odds-tools-sub-nav__primary-filters > div:nth-child(1) > select';
    const filters = ['spread', 'total', 'ml'];
    const filterSelector =
      'div.odds-tools-sub-nav__primary-filters > div:nth-child(2) > select';

    for (let i = 0; i < leagues.length; i++) {
      const league = leagues[i];
      await this.page.select(leagueSelector, league);
      await this.page.waitForNetworkIdle();
      this.league = league;

      let k = 0;
      while (k < 7) {
        for (let j = 0; j < filters.length; j++) {
          const filter = filters[j];
          await this.page.select(filterSelector, filter);
          await this.page.waitForNetworkIdle();
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
    const matchDataXpath = `//div[contains(@class, "best-odds__game-info")]//parent::td//parent::tr`;
    const matchElements = await this.page.$x(matchDataXpath);
    for (let i = 0; i < matchElements.length; i++) {
      const element = matchElements[i];

      const homeOpenPoint = await element.evaluate(
        (el: HTMLElement) => {
          try {
            return el.children[1].children[0].children[0].children[0].textContent?.trim();
          } catch (error) {
            console.log(
              `error in ${this.league} & ${this.filter} & Bet ==== `,
              error,
            );
            return '';
          }
        },
      );
      const awayOpenPoint = await element.evaluate(
        (el: HTMLElement) => {
          try {
            return el.children[1].children[0].children[1].children[0].textContent?.trim();
          } catch (error) {
            console.log(
              `error in ${this.league} & ${this.filter} & Bet ==== `,
              error,
            );
            return '';
          }
        },
      );
      const drawOpenPoint = await element.evaluate(
        (el: HTMLElement) => {
          try {
            return el.children[1].children[0].children[2].children[0].textContent?.trim();
          } catch (error) {
            console.log(
              `error in ${this.league} & ${this.filter} & Bet ==== `,
              error,
            );
            return '';
          }
        },
      );
      if (homeOpenPoint === '' || awayOpenPoint === '') break;

      const matchURL = await element.evaluate((el: HTMLElement) =>
        el.children[0].children[0].children[0].getAttribute('href'),
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
            return el.children[0].children[0].children[0].children[0].children[0].children[1].children[0].textContent?.trim();
          } catch (error) {
            console.log(
              `error in ${this.league} & ${this.filter} & Bet ==== `,
              error,
            );
            return '';
          }
        });
        const awayTeam = await element.evaluate((el: HTMLElement) => {
          try {
            return el.children[0].children[0].children[0].children[1].children[0].children[1].children[0].textContent?.trim();
          } catch (error) {
            console.log(
              `error in ${this.league} & ${this.filter} & Bet ==== `,
              error,
            );
            return '';
          }
        });
        const drawTeam = await element.evaluate((el: HTMLElement) => {
          try {
            return el.children[0].children[0].children[0].children[2].textContent?.trim();
          } catch (error) {
            console.log(
              `error in ${this.league} & ${this.filter} & Bet ==== `,
              error,
            );
            return '';
          }
        });

        const homeBestOddsPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const str =
                el.children[2].children[0].children[0].children[0].children[0].textContent?.trim();
              if (str === 'N/A') {
                return '';
              } else {
                return str;
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const awayBestOddsPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const str =
                el.children[2].children[0].children[1].children[0].children[0].textContent?.trim();
              if (str === 'N/A') {
                return '';
              } else {
                return str;
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const drawBestOddsPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const str =
                el.children[2].children[0].children[2].children[0].children[0].textContent?.trim();
              if (str === 'N/A') {
                return '';
              } else {
                return str;
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );

        const homePointsbetPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[3].children[0].children[0].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[3].children[0].children[0].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const awayPointsbetPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[3].children[0].children[1].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[3].children[0].children[1].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const drawPointsbetPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[3].children[0].children[2].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[3].children[0].children[2].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );

        const homeBetMGMPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[4].children[0].children[0].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[4].children[0].children[0].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const awayBetMGMPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[4].children[0].children[1].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[4].children[0].children[1].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const drawBetMGMPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[4].children[0].children[2].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[4].children[0].children[2].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );

        const homeCaesarPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[5].children[0].children[0].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[5].children[0].children[0].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const awayCaesarPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[5].children[0].children[1].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[5].children[0].children[1].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const drawCaesarPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[5].children[0].children[2].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[5].children[0].children[2].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );

        const homeFanduelPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[6].children[0].children[0].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[6].children[0].children[0].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const awayFanduelPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[6].children[0].children[1].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[6].children[0].children[1].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const drawFanduelPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[6].children[0].children[2].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[6].children[0].children[2].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );

        const homeDraftKingsPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[7].children[0].children[0].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[7].children[0].children[0].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const awayDraftKingsPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[7].children[0].children[1].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[7].children[0].children[1].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const drawDraftKingsPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[7].children[0].children[2].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[7].children[0].children[2].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );

        const homeBetRiversPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[8].children[0].children[0].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[8].children[0].children[0].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const awayBetRiversPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[8].children[0].children[1].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[8].children[0].children[1].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const drawBetRiversPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[8].children[0].children[2].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[8].children[0].children[2].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );

        const homeUnibetPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[10].children[0].children[0].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[10].children[0].children[0].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const awayUnibetPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[10].children[0].children[1].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[10].children[0].children[1].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const drawUnibetPoint = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[10].children[0].children[2].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[10].children[0].children[2].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );

        const homeBet365Point = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[11].children[0].children[0].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[11].children[0].children[0].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const awayBet365Point = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[11].children[0].children[1].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[11].children[0].children[1].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );
        const drawBet365Point = await element.evaluate(
          (el: HTMLElement) => {
            try {
              const fStr =
                el.children[11].children[0].children[2].children[0].children[0].textContent?.trim();
              if (fStr && fStr !== 'N/A') {
                return fStr;
              } else if (fStr === 'N/A') {
                return '';
              } else {
                return el.children[11].children[0].children[2].children[0].children[1].textContent?.trim();
              }
            } catch (error) {
              console.log(
                `error in ${this.league} & ${this.filter} & Bet ==== `,
                error,
              );
              return '';
            }
          },
        );

        let betData = [
          {
            team: homeTeam,
            open: homeOpenPoint,
            best_odd: homeBestOddsPoint,
            points_bet: homePointsbetPoint,
            bet_mgm: homeBetMGMPoint,
            caesar: homeCaesarPoint,
            fanduel: homeFanduelPoint,
            draft_kings: homeDraftKingsPoint,
            bet_rivers: homeBetRiversPoint,
            unibet: homeUnibetPoint,
            bet365: homeBet365Point,
          },
          {
            team: awayTeam,
            open: awayOpenPoint,
            best_odd: awayBestOddsPoint,
            points_bet: awayPointsbetPoint,
            bet_mgm: awayBetMGMPoint,
            caesar: awayCaesarPoint,
            fanduel: awayFanduelPoint,
            draft_kings: awayDraftKingsPoint,
            bet_rivers: awayBetRiversPoint,
            unibet: awayUnibetPoint,
            bet365: awayBet365Point,
          },
        ];

        if (drawTeam) {
          betData = [
            ...betData,
            {
              team: drawTeam,
              open: drawOpenPoint,
              best_odd: drawBestOddsPoint,
              points_bet: drawPointsbetPoint,
              bet_mgm: drawBetMGMPoint,
              caesar: drawCaesarPoint,
              fanduel: drawFanduelPoint,
              draft_kings: drawDraftKingsPoint,
              bet_rivers: drawBetRiversPoint,
              unibet: drawUnibetPoint,
              bet365: drawBet365Point,
            },
          ];
        }

        await betService.updateBet({
          league: this.league,
          filter: this.filter,
          matchId,
          matchDate,
          betDate,
          betData: JSON.stringify(betData),
        });
      }
    }
  }
}
