import { User, Theatre, Hall, Movie, Genre } from '@/types';

export const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', createdAt: '2024-01-15' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'banned', createdAt: '2024-02-20', ban: { id: 'b1', clientProfileId: '2', reason: 'Spam activity', createdAt: '2024-03-01' } },
  { id: '3', name: 'Alex Johnson', email: 'alex@example.com', status: 'active', createdAt: '2024-03-10' },
  { id: '4', name: 'Maria Garcia', email: 'maria@example.com', status: 'active', createdAt: '2024-04-05' },
  { id: '5', name: 'Anar Mammadov', email: 'anar@example.com', status: 'active', createdAt: '2024-04-12' },
];

export const mockGenres: Genre[] = [
  { id: 'g1', name: 'Action' },
  { id: 'g2', name: 'Comedy' },
  { id: 'g3', name: 'Drama' },
  { id: 'g4', name: 'Horror' },
  { id: 'g5', name: 'Sci-Fi' },
  { id: 'g6', name: 'Romance' },
];

export const mockTheatres: Theatre[] = [
  { id: 't1', name: 'CinemaPlus Ganjlik', address: 'Ganjlik Mall, Baku', latitude: '40.4093', longitude: '49.8671' },
  { id: 't2', name: 'Park Cinema Flame', address: 'Flame Towers, Baku', latitude: '40.3590', longitude: '49.8224' },
  { id: 't3', name: 'CinemaPlus 28 Mall', address: '28 Mall, Baku', latitude: '40.4219', longitude: '49.8097' },
];

export const mockHalls: Hall[] = [
  { id: 'h1', theatreId: 't1', theatreName: 'CinemaPlus Ganjlik', name: 'Hall 1', type: 'standard', rows: 10, columns: 12 },
  { id: 'h2', theatreId: 't1', theatreName: 'CinemaPlus Ganjlik', name: 'VIP Hall', type: 'vip', rows: 6, columns: 8 },
  { id: 'h3', theatreId: 't2', theatreName: 'Park Cinema Flame', name: 'IMAX', type: 'imax', rows: 15, columns: 20 },
  { id: 'h4', theatreId: 't3', theatreName: 'CinemaPlus 28 Mall', name: 'Dolby Atmos', type: 'dolby', rows: 12, columns: 16 },
];

export const mockMovies: Movie[] = [
  {
    id: 'm1',
    isForAdult: false,
    backdropPath: '/backdrop1.jpg',
    genreIds: ['g1', 'g5'],
    originalLanguage: 'en',
    languages: ['en', 'ru', 'az'],
    originalTitle: 'Interstellar',
    overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    posterPath: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    duration: '02:49:00',
    ageRestriction: 'PG-13',
    releaseDate: '2014-11-07',
    video: true,
    videoUrl: 'https://youtube.com/watch?v=xxx',
    actors: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    director: 'Christopher Nolan',
  },
  {
    id: 'm2',
    isForAdult: false,
    backdropPath: '/backdrop2.jpg',
    genreIds: ['g1', 'g3'],
    originalLanguage: 'en',
    languages: ['en', 'ru'],
    originalTitle: 'The Dark Knight',
    overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    posterPath: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    duration: '02:32:00',
    ageRestriction: 'PG-13',
    releaseDate: '2008-07-18',
    video: true,
    videoUrl: 'https://youtube.com/watch?v=yyy',
    actors: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
    director: 'Christopher Nolan',
  },
  {
    id: 'm3',
    isForAdult: true,
    backdropPath: '/backdrop3.jpg',
    genreIds: ['g4'],
    originalLanguage: 'en',
    languages: ['en'],
    originalTitle: 'The Shining',
    overview: 'A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence.',
    posterPath: 'https://image.tmdb.org/t/p/w500/nRj5511mZdTl4saWEPoj9QroTIu.jpg',
    duration: '02:26:00',
    ageRestriction: 'R',
    releaseDate: '1980-05-23',
    video: true,
    videoUrl: 'https://youtube.com/watch?v=zzz',
    actors: ['Jack Nicholson', 'Shelley Duvall'],
    director: 'Stanley Kubrick',
  },
];
