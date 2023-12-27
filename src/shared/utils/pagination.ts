import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from '@/config/constants';

export type PaginationResult = {
  rows: any[];
  perPage: number;
  totalRows: number;
  totalPages: number;
  currentPage: number;
  nextPage: number;
  prevPage: number;
};

export class Pagination {
  public offset = 0;

  constructor(
    public readonly limit = PAGINATION_DEFAULT_LIMIT,
    public readonly page = PAGINATION_DEFAULT_PAGE,
  ) {
    this.offset = (page - 1) * limit;
  }

  public static fromRequest(request: any) {
    const { limit = PAGINATION_DEFAULT_LIMIT, page = PAGINATION_DEFAULT_PAGE } =
      request.query;
    return new Pagination(Number(limit), Number(page));
  }

  public toJSON<T>(rows: T[], totalRows: number): PaginationResult {
    const totalPages = Math.max(Math.ceil(totalRows / this.limit), 1);
    const nextPage = totalPages > this.page ? this.page + 1 : totalPages;
    const prevPage = this.page > 1 ? this.page - 1 : 1;
    return {
      rows,
      perPage: this.limit,
      totalRows,
      totalPages,
      currentPage: this.page,
      nextPage,
      prevPage,
    };
  }
}
