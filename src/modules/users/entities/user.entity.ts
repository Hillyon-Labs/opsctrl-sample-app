import { BaseEntity } from 'src/common/entity/entity';
import { Role, UserStatus } from 'src/common/enum/enum';
import { Organization } from 'src/modules/organizations/entities/organization.entity';
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User extends BaseEntity {
  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'uuid', nullable: true, name: 'org_id' })
  orgId: string;

  @ManyToOne(() => Organization, (org) => org.users)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ type: 'enum', enum: Role, default: Role.DEVELOPER })
  role: Role;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;
}
