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
    public readonly limit = 100,
    public readonly page = 1,
  ) {
    this.offset = (page - 1) * limit;
  }

  public static fromRequest(request: any) {
    const { limit, page } = request.query;
    return new Pagination(limit, page);
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
