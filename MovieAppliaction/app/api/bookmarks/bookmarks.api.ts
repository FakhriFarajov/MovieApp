import { authHttp } from '../HttpClient';
import { BookmarksResponse } from './bookmarks.types';

export async function fetchBookmarks(): Promise<BookmarksResponse> {
  const response = await authHttp.get(`/Bookmarks/get`);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch bookmarks: ${response.statusText}`);
  }
  console.log('Fetched bookmarks:', response.data);
  return response.data as BookmarksResponse;
}

export async function addBookmark(movieId: string) {
  console.log('Adding bookmark for movieId:', movieId);
  const response = await authHttp.post(`/Bookmarks/add/${encodeURIComponent(movieId)}`);
  console.log('Added bookmark:', response);
  // Some backends return a simple { isSuccess: true } for create/delete operations.
  return response.data;
}

export async function deleteBookmark(movieId: string) {
  console.log('Deleting bookmark for movieId:', movieId);
  const response = await authHttp.delete(`/Bookmarks/remove/${encodeURIComponent(movieId)}`);
  console.log('Deleted bookmark:', response);
  return response;
}