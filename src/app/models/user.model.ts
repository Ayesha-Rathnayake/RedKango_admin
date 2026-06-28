export type UserStatus = 'Active' | 'Inactive' | 'Deactivated';

export interface User {
  id: number;
  userId: string;
  name: string;
  email: string;
  phone: string;
  joined?: string | null;
  active: boolean;
  locked: boolean;
  status: UserStatus;
}

export interface UserViewModel {
  id: number;
  userId: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string | null;
  active: boolean;
  locked: boolean;
  status: UserStatus;
}