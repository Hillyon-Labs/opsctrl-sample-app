export enum AppEnvironment {
  DEV = 'development',
  TEST = 'test',
  PROD = 'production',
  DEBUG = 'debug',
}

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
}
export const RolePermissions = {
  [Role.OWNER]: ['*'],
  [Role.ADMIN]: ['manage_users', 'view_logs'],
  [Role.DEVELOPER]: ['deploy', 'view_logs', 'run_diagnostics'],
  [Role.VIEWER]: ['view_logs'],
};

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}
