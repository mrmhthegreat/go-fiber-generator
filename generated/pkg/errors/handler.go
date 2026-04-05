package errors
import (
"fmt"
"github.com/gofiber/fiber/v2"
"strings"

resppkg "github.com/username/my_api/pkg/response"


)
// SendError sends a standardized error response
func SendError(c *fiber.Ctx, status int, errorCode string, details ...string) error {
message := errorCode
if len(details) > 0 {
message = fmt.Sprintf("%s: %s", errorCode, strings.Join(details, ", "))
}

return c.Status(status).JSON(resppkg.ErrorResponse{
Error: message,
})
}