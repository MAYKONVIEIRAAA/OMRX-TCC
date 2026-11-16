import { formatCompactCount } from "../formatters/numberFormatter.js";
import { LINK_CHECK_MESSAGES } from "../messages.js";
import { buildCheckLinkUrl } from "../routes.js";
import { getStats } from "../services/statsService.js";
import { isLoggedIn } from "../services/userService.js";
import { initAccordion } from "../ui/accordion.js";
import { restoreButton } from "../ui/button.js";
import { initValidatedForm } from "../ui/validatedForm.js";
import { linkCheckValidator } from "../validators/linkValidator.js";

const COMPACT_PLACEHOLDER_MEDIA_QUERY = "(max-width: 480px)";

const linkCheckForm = document.getElementById("link-check-form");
const guestActions = document.getElementById("hero-guest-actions");
const totalVerificationsValue = document.getElementById("stats-total-verifications");

async function loadTotalVerifications() {
  try {
    const { totalVerifications } = await getStats();
    totalVerificationsValue.textContent = formatCompactCount(totalVerifications);
  } catch {
    totalVerificationsValue.textContent = formatCompactCount(0);
  }
}

function usePlaceholderForViewport(input) {
  const fullPlaceholder = input.placeholder;
  const compactViewport = window.matchMedia(COMPACT_PLACEHOLDER_MEDIA_QUERY);

  const updatePlaceholder = () => {
    input.placeholder = compactViewport.matches
      ? input.dataset.compactPlaceholder
      : fullPlaceholder;
  };

  updatePlaceholder();
  compactViewport.addEventListener("change", updatePlaceholder);
}

function initLinkCheckForm() {
  const submitButton = linkCheckForm.querySelector('button[type="submit"]');

  linkCheckForm.hidden = false;
  usePlaceholderForViewport(linkCheckForm.elements.url);

  initValidatedForm({
    form: linkCheckForm,
    validator: linkCheckValidator,
    loadingLabel: LINK_CHECK_MESSAGES.submitting,
    fallbackErrorMessage: LINK_CHECK_MESSAGES.unexpectedError,
    onValidSubmit({ url }) {
      window.location.assign(buildCheckLinkUrl(url.trim()));
    },
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) restoreButton(submitButton);
  });
}

if (isLoggedIn()) {
  initLinkCheckForm();
} else {
  guestActions.hidden = false;
}

loadTotalVerifications();
initAccordion(document.querySelector(".faq__list"));
