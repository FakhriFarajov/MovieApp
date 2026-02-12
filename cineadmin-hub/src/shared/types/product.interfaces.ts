export interface ProductSummary {
  id: string;
  productTitle: string;
  description: string;
  mainImage: string | null;
  storeName: string;
  price: number;
  categoryName: string;
  categoryChain: string[];
  reviewsCount: number;
  averageRating: number;
}

export interface PaginatedApiResponse<T> {
  isSuccess: boolean;
  message: string;
  statusCode: number;
  data: T[];
  page: number;
  contentPerPage: number;
  totalItems: number;
  totalPages: number;
}
