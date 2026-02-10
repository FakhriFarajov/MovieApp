using System.Collections.Generic;

namespace MovieAdminFeaturesApi.Core.DTOs.Pagination;

public class PaginatedResult<T>
{
    public IEnumerable<T> Items { get; }
    public int Total { get; }
    public int Page { get; }
    public int PageSize { get; }

    private PaginatedResult(IEnumerable<T> items, int total, int page, int pageSize)
    {
        Items = items;
        Total = total;
        Page = page;
        PageSize = pageSize;
    }

    public static PaginatedResult<T> Success(IEnumerable<T> items, int total, int page = 1, int pageSize = 15)
    {
        return new PaginatedResult<T>(items, total, page, pageSize);
    }
}
