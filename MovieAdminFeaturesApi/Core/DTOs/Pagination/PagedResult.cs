using System.Collections.Generic;

namespace MovieAdminFeaturesApi.Core.DTOs.Pagination;

public record PagedResult<T>(IEnumerable<T> Items, int TotalCount, int Page, int PageSize);
