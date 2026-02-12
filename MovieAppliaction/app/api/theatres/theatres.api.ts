import { authHttp } from "../HttpClient";
import { TheatresResponse } from './theatres.types';

export const fetchTheatres = async (): Promise<TheatresResponse> => {
    const response = await authHttp.get(`/Theatres/getAll`);
    console.log('Fetched theatres:', response);
    return response.data as TheatresResponse;
};
