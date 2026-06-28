export interface AdminProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  profileImageUrl: string;
  fullName?: string;
}

export interface AdminViewModel {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string;
  avatarInitial: string;
}

export interface UpdateAdminProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  profileImageUrl: string;
}