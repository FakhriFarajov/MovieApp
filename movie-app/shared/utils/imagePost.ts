import axios from "axios";
import { tokenStorage } from "@/shared/tokenStorage";


export async function uploadImage(file: File): Promise<string> {
  // prefer admin-specific env var, fall back to generic features API
  const base = import.meta.env.VITE_ADMIN_FEATURES_API || import.meta.env.VITE_FEATURES_API || "http://localhost:5298";
  const formData = new FormData();
  formData.append("file", file);
  // try multipart upload first
  try {
    const response = await axios.post(
      `${base}/api/Admin/Images/UploadImage`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${tokenStorage.get()}`,
        },
      }
    );
    // If backend returns the objectName directly
    if (typeof response.data === "string") return response.data;
    if (response.data?.data?.objectName) return response.data.data.objectName;
    if (response.data?.objectName) return response.data.objectName;
    // fall through to error below if no object found
    throw new Error("Image upload response does not contain an objectName");
  } catch (err: any) {
    // If server doesn't accept multipart or endpoint behaves differently, try form-urlencoded fallback
    const status = err?.response?.status;
    if (![404, 415, 400].includes(status)) {
      throw err;
    }
    // build urlencoded payload similar to provided curl
    const params = new URLSearchParams();
    params.append('ContentType', file.type || 'application/octet-stream');
    params.append('ContentDisposition', 'attachment');
    // Headers.propertyName* left empty as in example
    params.append('Headers.propertyName*', '');
    params.append('Length', String(file.size || 0));
    params.append('Name', file.name || 'file');
    params.append('FileName', file.name || 'file');

    const fallbackResp = await axios.post(
      `${base}/api/Admin/Images/UploadImage`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${tokenStorage.get()}`,
        },
      }
    );
    if (typeof fallbackResp.data === "string") return fallbackResp.data;
    if (fallbackResp.data?.data?.objectName) return fallbackResp.data.data.objectName;
    if (fallbackResp.data?.objectName) return fallbackResp.data.objectName;
    throw new Error("Image upload response does not contain an objectName");
  }
}


export async function getImage(objectName: string): Promise<string> {
  const base = import.meta.env.VITE_ADMIN_FEATURES_API || import.meta.env.VITE_FEATURES_API || "http://localhost:5298";
  const response = await axios.get(
    `${base}/api/Admin/Images/GetImage`,
    {
      params: { objectName },
      headers: { "Authorization": `Bearer ${tokenStorage.get()}` },
    }
  );
  // If backend returns the URL directly
  if (typeof response.data === "string") return response.data;
  // If backend returns { url: string }
  if (response.data?.url) return response.data.url;
  throw new Error("Image URL response does not contain a url");
}