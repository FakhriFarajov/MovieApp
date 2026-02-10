namespace MovieClientFeaturesApi.Application.Services.Interfaces;

public interface ILibreTranslateService
{
    Task<Dictionary<string, string>> TranslateMultipleAsync(string text, IEnumerable<string> targetLanguages, string? sourceLanguage = null);
}
