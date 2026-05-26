import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@mlm-saas/database';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
