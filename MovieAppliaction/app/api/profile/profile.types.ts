export interface Profile {
  id?: string;
  name?: string | null;
  surname?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  dateOfBirth?: string | null; // ISO date string
  profileImage?: string | null; // object name or URL depending on backend
  // allow extra server fields
  [key: string]: any;
}

export interface ProfileResponse {
  isSuccess: boolean;
  message?: string;
  statusCode?: number;
  data?: Profile | null;
}

// Matches server-side ClientProfileUpdateRequestDTO (kept for updates)
export interface UpdateProfileRequest {
  Name?: string | null;
  Surname?: string | null;
  PhoneNumber?: string | null;
  Email?: string | null;
  DateOfBirth?: string | null | Date; // allow Date on client, will be serialized
  ProfileImageObjectName?: string | null; // controller sets this after upload; optional on request
  // file to upload for profile image (React Native { uri, name, type } or File in web)
  profileImage?: any;
  [key: string]: any;
}
