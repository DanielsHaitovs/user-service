export interface RequestWithUserPermissions extends Request {
  user: {
    permissions: string[];
  };
}
