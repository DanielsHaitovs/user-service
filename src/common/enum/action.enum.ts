export enum StoreAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ASSIGN = 'ASSIGN',
  UNASSIGN = 'UNASSIGN',
}

export enum RoleAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ASSIGN = 'ASSIGN',
  UNASSIGN = 'UNASSIGN',
}

export enum UserScope {
  USER = 'user',
  STORE = 'store',
  ROLE = 'role',
}

export enum UserAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ASSIGN_ROLE = 'assign_role',
  REVOKE_ROLE = 'revoke_role',
  ASSIGN_PERMISSION = 'assign_permission',
  REVOKE_PERMISSION = 'revoke_permission',
  ASSIGN_STORE = 'assign_store',
  REVOKE_STORE = 'revoke_store',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGE = 'password_change',
  EMAIL_VERIFICATION = 'email_verification',
  PROFILE_UPDATE = 'profile_update',
}
