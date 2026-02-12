import { authHttp } from '../HttpClient';
import { Profile, ProfileResponse, UpdateProfileRequest } from './profile.types';

export const getProfile = async (): Promise<Profile | null> => {
  const res = await authHttp.get(`/Profile/getProfile`);
  if (res.status !== 200) throw new Error(`Failed to get profile: ${res.statusText}`);
  console.log('Fetched profile response:', res.data);
  const resPayload = res.data as ProfileResponse;
  if (!resPayload?.isSuccess) {
    throw new Error(resPayload?.message || 'Failed to get profile');
  }
  return resPayload.data ?? null;
};

// Accepts multipart/form-data — caller should build FormData and include optional file under `profileImage` key
export const editProfile = async (payload: UpdateProfileRequest): Promise<Profile> => {
  const form = new FormData();
  Object.keys(payload).forEach((k) => {
    const v = (payload as any)[k];
    if (v === undefined || v === null) return;
    if (k === 'profileImage' && v) {
      // assume v is a File-like object or { uri, name, type } for React Native
      form.append('profileImage', v as any);
    } else if (k === 'DateOfBirth' || k === 'dateOfBirth') {
      // serialize date
      const d = v instanceof Date ? v.toISOString() : String(v);
      form.append('DateOfBirth', d);
    } else {
      form.append(k, String(v));
    }
  });

  const res = await authHttp.put(`/Profile/editProfile`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (![200, 201].includes(res.status)) throw new Error(`Failed to edit profile: ${res.statusText}`);
  console.log('Edited profile response:', res.data);
  const editResPayload = res.data as ProfileResponse;
  if (!editResPayload?.isSuccess) throw new Error(editResPayload?.message || 'Failed to edit profile');
  return editResPayload.data as Profile;
};
