import { MecBaseEntity } from '@/base/mec.entity';
import { COUNTRIES } from '@/libConst/countries.const';
import { UserDepartments } from '@/userEntities/userDepartments.entity';
import { UserRole } from '@/userEntities/userRoles.entity';

import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { UUID } from 'crypto';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';

@Entity('users')
@Unique('UQ_USER_EMAIL', ['email'], { deferrable: 'INITIALLY IMMEDIATE' })
@Index('IX_USER_CREATED_AT', ['createdAt'])
@Index('IX_USER_CREATED_AT_EMAIL', ['createdAt', 'email'])
@Index('IX_USER_IS_ACTIVE_EMAIL', ['isActive', 'email'])
@Index('IX_USER_EMAIL_FIRSTNAME', ['email', 'firstName'])
@Index('IX_USER_EMAIL_LASTNAME', ['email', 'lastName'])
export class User extends MecBaseEntity {
  @Column({ type: 'enum', enum: COUNTRIES })
  @IsNotEmpty()
  @IsEnum(COUNTRIES)
  country: COUNTRIES;

  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @Column({ unique: true, length: 255 })
  @IsNotEmpty()
  @IsString()
  email: string;

  @Column({ length: 255 })
  @IsNotEmpty()
  @IsString()
  password: string;

  @Column({ nullable: true, length: 40 })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @Column({ type: 'date', nullable: true })
  @IsNotEmpty()
  @IsString()
  dateOfBirth: Date;

  @Column({ default: true })
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  @Column({ default: false, nullable: false })
  @IsNotEmpty()
  @IsBoolean()
  isEmailVerified: boolean;

  @Column({ nullable: true })
  @IsNotEmpty()
  @IsString()
  emailVerificationToken: string;

  @Column({ nullable: true })
  @IsNotEmpty()
  @IsString()
  passwordResetToken: string;

  @Column({ nullable: true })
  @IsNotEmpty()
  @IsDate()
  passwordResetExpires: Date;

  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @Column({ nullable: true })
  twoFactorSecret: string;

  @OneToMany(() => UserDepartments, (userDepartment) => userDepartment.users)
  userDepartments: UserDepartments[];

  @OneToMany(() => UserRole, (userRole) => userRole.users)
  userRoles: UserRole[];

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  constructor(
    id: UUID,
    country: COUNTRIES,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phone: string,
    dateOfBirth: Date,
    isActive: boolean,
    isEmailVerified: boolean,
    passwordResetExpires: Date,
    emailVerificationToken: string,
    passwordResetToken: string,
    createdAt: Date,
    updatedAt: Date,
    isTwoFactorEnabled: boolean,
    twoFactorSecret: string,
    userDepartments: UserDepartments[],
    userRoles: UserRole[],
    createdBy: User,
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
    this.country = country;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.phone = phone;
    this.dateOfBirth = dateOfBirth;
    this.isActive = isActive;
    this.isEmailVerified = isEmailVerified;
    this.emailVerificationToken = emailVerificationToken;
    this.passwordResetToken = passwordResetToken;
    this.passwordResetExpires = passwordResetExpires;
    this.userDepartments = userDepartments;
    this.isTwoFactorEnabled = isTwoFactorEnabled;
    this.twoFactorSecret = twoFactorSecret;
    this.userRoles = userRoles;
    this.createdBy = createdBy;
  }
}
