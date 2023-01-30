import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateTimeEntity } from './base';

@Entity('pro_reports', { orderBy: { id: 'ASC' } })
export class ProReport extends DateTimeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ nullable: true })
  league: string;

  @Column({ nullable: true })
  filter: string;

  @Column({ nullable: true })
  matchId: string;

  @Column({ nullable: true })
  matchDate: string;

  @Column({ nullable: true })
  betDate: string;

  @Column({ nullable: true })
  bet: string;
}
