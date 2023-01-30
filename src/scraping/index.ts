import { sleep } from '../utils/timeout';
import Bet from './bet';
import ProReport from './pro_report';

const bet = new Bet();
const proReport = new ProReport();

export async function startScraping() {
  while (true) {
    try {
      console.log('~~~ scraping bet started ~~~');
      await bet.start();
      console.log('~~~ scraping bet ended ~~~');
    } catch (error) {
      await bet.stop();
      console.log('error in bet = ', error);
    }

    try {
      console.log('~~~ scraping pro report started ~~~');
      await proReport.start();
      console.log('~~~ scraping pro report ended ~~~');
    } catch (error) {
      await proReport.stop();
      console.log('error = in pro report ', error);
    }

    await sleep(300000); // delay for 5 minutes
  }
}
