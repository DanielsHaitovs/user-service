import { MecBaseEntity } from '@/base/mec.entity';
import { Department } from '@/department/entities/department.entity';
import { UserRole } from '@/user/entities/userRoles.entity';

import { IsBoolean, IsDate, IsNotEmpty, IsString } from 'class-validator';
import { UUID } from 'crypto';
import { Column, Entity, OneToMany, Unique } from 'typeorm';

@Entity('users')
@Unique('UQ_USER_EMAIL', ['email'], { deferrable: 'INITIALLY IMMEDIATE' })
export class User extends MecBaseEntity {
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

  @OneToMany(() => Department, (department) => department.user)
  departments: Department[];

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  constructor(
    id: UUID,
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
    departments: Department[],
    userRoles: UserRole[],
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
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
    this.departments = departments;
    this.isTwoFactorEnabled = isTwoFactorEnabled;
    this.twoFactorSecret = twoFactorSecret;
    this.userRoles = userRoles;
  }
}
