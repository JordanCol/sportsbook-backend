import { AppDataSource } from '../data-source';
import { ProReport } from '../entities/pro_report.entity';

const repository = AppDataSource.getRepository(ProReport);

const getReports = async (filter: any) => {
  try {
    const requests = await repository.find();
    return requests;
  } catch (error) {
    return null;
  }
};

const updateProReport = async (data: any) => {
  const value = await repository.findOneBy({
    matchId: data.matchId,
    league: data.league,
    filter: data.filter,
  });
  if (value && value.bet !== data.bet) {
    console.log('*** updating old data *** ', data);
    value.bet = data.bet;
    await repository.save(value);
  } else if (!value) {
    console.log('*** saving new data *** ', data);
    await repository.save(data);
  }
};

export default { getReports, updateProReport };
