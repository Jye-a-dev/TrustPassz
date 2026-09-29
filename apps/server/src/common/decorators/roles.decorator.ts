import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Role identifiers encompassing platform system roles and domain participant roles.
 */
export enum Role {
  USER = 'USER',
  SELLER = 'SELLER',
  BUYER = 'BUYER',
  ADMIN = 'ADMIN',
  ARBITRATOR = 'ARBITRATOR',
}

export type RoleType = Role | UserRole | keyof typeof Role | string;

/**
 * Decorator to attach authorized roles metadata to controller routes or classes.
 * @param roles Permitted role types
 */
export const Roles = (...roles: (Role | UserRole | string)[]) =>
  SetMetadata(ROLES_KEY, roles);
