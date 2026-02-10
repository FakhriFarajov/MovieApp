export interface Genre {
  id: number;
  name: string;
}

export interface GenresResponse {
  genres: Genre[];
}

export enum SortBy {
  PopularityDesc = 'popularity.desc',
  PopularityAsc = 'popularity.asc',

  OriginalTitleAsc = 'original_title.asc',
  OriginalTitleDesc = 'original_title.desc',

  RevenueAsc = 'revenue.asc',
  RevenueDesc = 'revenue.desc',

  PrimaryReleaseDateAsc = 'primary_release_date.asc',
  PrimaryReleaseDateDesc = 'primary_release_date.desc',

  TitleAsc = 'title.asc',
  TitleDesc = 'title.desc',

  VoteAverageAsc = 'vote_average.asc',
  VoteAverageDesc = 'vote_average.desc',

  VoteCountAsc = 'vote_count.asc',
  VoteCountDesc = 'vote_count.desc',
}
