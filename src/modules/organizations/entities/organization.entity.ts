import { BaseEntity } from 'src/common/entity/entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Entity, Column, OneToMany, Index } from 'typeorm';

@Entity('organizations')
export class Organization extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tier: string; // 'free', 'pro', 'enterprise'

  @Index('IDX_ORG_SUBSCRIPTION_STATUS')
  @Column({ type: 'varchar', length: 50, nullable: true })
  subscriptionStatus: string; // 'active', 'inactive', 'trial', 'cancelled'

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];
}
