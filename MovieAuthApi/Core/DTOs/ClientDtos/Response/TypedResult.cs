namespace MovieAuthApi.Core.DTOs.ClientDtos.Response;

public class TypedResult<T>
{
    public bool IsSuccess { get; }
    public string Message { get; }
    public int StatusCode { get; }
    public T? Data { get; }

    private TypedResult(bool isSuccess, string message, int statusCode, T? data = default)
    {
        IsSuccess = isSuccess;
        Message = message;
        StatusCode = statusCode;
        Data = data;
    }

    public static TypedResult<T> Success(T? data = default, string message = "Success", int statusCode = 200)
    {
        return new TypedResult<T>(true, message, statusCode, data);
    }

    // Add an overload to include data in error results while keeping backward compatibility
    public static TypedResult<T> Error(string message = "An error occurred", int statusCode = 400, T? data = default)
    {
        return new TypedResult<T>(false, message, statusCode, default);
    }
}