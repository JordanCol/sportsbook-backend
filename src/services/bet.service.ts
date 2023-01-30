import { AppDataSource } from '../data-source';
import { Bet } from '../entities/bet.entity';

const repository = AppDataSource.getRepository(Bet);

const getBets = async (filter: any) => {
  try {
    const requests = await repository.find();
    return requests;
  } catch (error) {
    return null;
  }
};

const updateBet = async (data: any) => {
  const value = await repository.findOneBy({
    matchId: data.matchId,
    league: data.league,
    filter: data.filter,
  });
  if (value && value.betData !== data.betData) {
    console.log('*** updating old data *** ', data);
    value.betData = data.betData;
    await repository.save(value);
  } else if (!value) {
    console.log('*** saving new data *** ', data);
    await repository.save(data);
  }
};

export default { getBets, updateBet };
