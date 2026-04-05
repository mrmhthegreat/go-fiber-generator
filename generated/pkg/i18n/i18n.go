package i18n

import (
    "strings"

    "github.com/gofiber/contrib/fiberi18n/v2"
    "github.com/gofiber/fiber/v2"
    "github.com/nicksnyder/go-i18n/v2/i18n"
)

// DetectLanguage from Header or Cookie
func DetectLanguage(c *fiber.Ctx) string {
    lang := c.Cookies("lang") // Web case

    if lang == "" {
        lang = c.Get("Accept-Language") // API case
    }
    if lang == "" {
        lang = "en"
    }

    // Use only the first part (e.g., "en-US" → "en")
    return strings.Split(lang, "-")[0]
}

// Translate retrieves a localized message
func Translate(messageID string, c *fiber.Ctx, data map[string]interface{}) string {
    message := fiberi18n.MustLocalize(c, &i18n.LocalizeConfig{
        MessageID:    messageID,
        TemplateData: data})

    return message
}

// TranslateS translates a simple string
func TranslateS(c *fiber.Ctx, keys string) string {
    translations := fiberi18n.MustLocalize(c, keys)
    return translations
}

// TranslateMap translates multiple keys into a map
func TranslateMap(c *fiber.Ctx, keys []string) map[string]string {
    translations := make(map[string]string)
    for _, key := range keys {
        translations[key] = fiberi18n.MustLocalize(c, key)
    }
    return translations
}

// MergeMaps merges multiple maps into one
func MergeMaps(maps ...map[string]string) map[string]string {
    result := make(map[string]string)
    for _, m := range maps {
        for k, v := range m {
            result[k] = v
        }
    }
    return result
}
