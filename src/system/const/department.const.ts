import {
  CREATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  READ_DEPARTMENT,
  UPDATE_DEPARTMENT,
} from '@/commonConst/department.const';
import type { SystemRole } from '@/system/system-role.interface';

export const UPDATE_DEPARTMENT_ENDPOINT_PERMISSION = [
  UPDATE_DEPARTMENT,
  READ_DEPARTMENT,
] as string[];

export const DELETE_DEPARTMENT_ENDPOINT_PERMISSION = [
  DELETE_DEPARTMENT,
  READ_DEPARTMENT,
] as string[];

export const CREATE_DEPARTMENT_ENDPOINT_PERMISSION = [
  CREATE_DEPARTMENT,
  READ_DEPARTMENT,
] as string[];

export const READ_DEPARTMENT_ENDPOINT_PERMISSION = [
  READ_DEPARTMENT,
] as string[];

export const ROLE_TO_CREATE_DEPARTMENT: SystemRole = {
  name: 'Create Department',
  permissions: CREATE_DEPARTMENT_ENDPOINT_PERMISSION,
};
export const ROLE_TO_READ_DEPARTMENT: SystemRole = {
  name: 'Read Department',
  permissions: READ_DEPARTMENT_ENDPOINT_PERMISSION,
};
export const ROLE_TO_UPDATE_DEPARTMENT: SystemRole = {
  name: 'Update Department',
  permissions: UPDATE_DEPARTMENT_ENDPOINT_PERMISSION,
};
export const ROLE_TO_DELETE_DEPARTMENT: SystemRole = {
  name: 'Delete Department',
  permissions: DELETE_DEPARTMENT_ENDPOINT_PERMISSION,
};
