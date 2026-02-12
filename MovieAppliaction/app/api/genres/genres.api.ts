import { authHttp } from "../HttpClient";

export async function fetchGenres() {
  const response = await authHttp.get(`/Genres/getAllGenres`);
  return response;
}