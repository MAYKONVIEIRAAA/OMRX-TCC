import { VERIFICATION_RESENT_ERROR_CODE } from "../config.js";
import { LOGIN_MESSAGES } from "../messages.js";
import { PAGES } from "../routes.js";
import { login } from "../services/userService.js";
import { initValidatedForm } from "../ui/validatedForm.js";
import { loginValidator } from "../validators/userValidator.js";

initValidatedForm({
  form: document.getElementById("login-form"),
  validator: loginValidator,
  loadingLabel: LOGIN_MESSAGES.submitting,
  fallbackErrorMessage: LOGIN_MESSAGES.unexpectedError,
  async onValidSubmit(credentials) {
    try {
      await login(credentials);
    } catch (error) {
      if (error.code === VERIFICATION_RESENT_ERROR_CODE) {
        return { successMessage: error.message };
      }
      throw error;
    }

    window.location.assign(PAGES.home);
  },
});
