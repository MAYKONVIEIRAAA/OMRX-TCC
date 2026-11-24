import { DELETE_ACCOUNT_MESSAGES } from "../messages.js";
import { PAGES } from "../routes.js";
import { clearSession, deleteAccount, isLoggedIn } from "../services/userService.js";
import { initValidatedForm } from "../ui/validatedForm.js";
import { deleteAccountValidator } from "../validators/userValidator.js";

const form = document.getElementById("delete-account-form");
const formFields = document.getElementById("delete-account-fields");
const confirmationCheckbox = form.elements.confirmDeletion;
const submitButton = form.querySelector('button[type="submit"]');

function redirectToLogin() {
  window.location.replace(PAGES.login);
}

function syncSubmitButton() {
  submitButton.disabled = !confirmationCheckbox.checked;
}

async function removeAccount(formValues) {
  if (!isLoggedIn()) {
    redirectToLogin();
    return;
  }

  formFields.disabled = true;

  try {
    await deleteAccount(formValues);
  } finally {
    formFields.disabled = false;
  }

  clearSession();
  window.location.replace(PAGES.home);
}

function initDeleteAccountPage() {
  if (!isLoggedIn()) {
    redirectToLogin();
    return;
  }

  initValidatedForm({
    form,
    validator: deleteAccountValidator,
    loadingLabel: DELETE_ACCOUNT_MESSAGES.submitting,
    fallbackErrorMessage: DELETE_ACCOUNT_MESSAGES.unexpectedError,
    onValidSubmit: removeAccount,
  });

  confirmationCheckbox.addEventListener("change", syncSubmitButton);
  syncSubmitButton();
}

initDeleteAccountPage();
