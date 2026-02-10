using System.Net.Http;
using System.Text;
using System.Text.Json;
using MovieAdminFeaturesApi.Application.Services.Interfaces;

namespace MovieAdminFeaturesApi.Application.Services.Classes;

public class LibreTranslateService : ILibreTranslateService
{
    private readonly HttpClient _http;
    private readonly int _defaultAlternatives = 3;
    private readonly string _apiKey;
    private readonly int _perRequestTimeoutMs = 5000;

    public LibreTranslateService(HttpClient http)
    {
        _http = http;
        _apiKey = Environment.GetEnvironmentVariable("LIBRETRANSLATE_API_KEY")
                  ?? Environment.GetEnvironmentVariable("LIBRETRANSLATE__APIKEY")
                  ?? string.Empty;

        var t = Environment.GetEnvironmentVariable("LIBRETRANSLATE_TIMEOUT_MS");
        if (!string.IsNullOrWhiteSpace(t) && int.TryParse(t, out var parsed) && parsed > 0)
            _perRequestTimeoutMs = parsed;
    }

    public async Task<Dictionary<string, string>> TranslateMultipleAsync(string text, IEnumerable<string> targetLanguages, string? sourceLanguage = null)
    {
        var result = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(text)) return result;

        sourceLanguage ??= "auto";
        var targets = targetLanguages?.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()).Distinct().ToList() ?? new List<string>();
        if (targets.Count == 0) return result;

        var tasks = targets.Select(lang => WithTimeout(TranslateAsync(text, lang, sourceLanguage, _defaultAlternatives, _apiKey), TimeSpan.FromMilliseconds(_perRequestTimeoutMs))).ToList();
        var responses = await Task.WhenAll(tasks);

        for (int i = 0; i < targets.Count; i++)
        {
            var tr = responses[i];
            if (!string.IsNullOrWhiteSpace(tr)) result[targets[i]] = tr!;
        }

        return result;
    }

    private static async Task<string?> WithTimeout(Task<string?> task, TimeSpan timeout)
    {
        var delay = Task.Delay(timeout);
        var completed = await Task.WhenAny(task, delay);
        if (completed == delay) return null;
        try
        {
            return await task; // already completed
        }
        catch
        {
            return null;
        }
    }

    private async Task<string?> TranslateAsync(string text, string targetLanguage, string sourceLanguage, int alternatives, string apiKey)
    {
        try
        {
            var payload = new Dictionary<string, object?>
            {
                ["q"] = text,
                ["source"] = sourceLanguage ?? "auto",
                ["target"] = targetLanguage,
                ["format"] = "text",
                ["alternatives"] = alternatives
            };

            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                payload["api_key"] = apiKey;
            }

            using var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            using var res = await _http.PostAsync("/translate", content);
            if (!res.IsSuccessStatusCode)
            {
                return null;
            }

            var body = await res.Content.ReadAsStringAsync();
            if (string.IsNullOrWhiteSpace(body)) return null;

            try
            {
                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;

                if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("alternatives", out var alternativesElem) && alternativesElem.ValueKind == JsonValueKind.Array && alternativesElem.GetArrayLength() > 0)
                {
                    foreach (var alt in alternativesElem.EnumerateArray())
                    {
                        if (alt.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(alt.GetString()))
                            return alt.GetString();
                    }
                }

                if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("translatedText", out var tt))
                    return tt.GetString();

                if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object
                    && data.TryGetProperty("translations", out var transArr) && transArr.ValueKind == JsonValueKind.Array && transArr.GetArrayLength() > 0)
                {
                    var first = transArr[0];
                    if (first.ValueKind == JsonValueKind.Object && first.TryGetProperty("translatedText", out var ft)) return ft.GetString();
                    if (first.ValueKind == JsonValueKind.String) return first.GetString();
                }

                if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
                {
                    var first = root[0];
                    if (first.ValueKind == JsonValueKind.Object && first.TryGetProperty("translatedText", out var ft2)) return ft2.GetString();
                    if (first.ValueKind == JsonValueKind.String) return first.GetString();
                }

                if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("text", out var ptext)) return ptext.GetString();
                if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("translation", out var ptrans)) return ptrans.GetString();

                if (root.ValueKind == JsonValueKind.String) return root.GetString();
            }
            catch
            {
            }
        }
        catch
        {
        }

        return null;
    }
}
