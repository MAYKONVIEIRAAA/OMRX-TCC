import { LINK_CHECK_MESSAGES } from "../messages.js";
import { createValidator } from "./createValidator.js";

const SUPPORTED_PROTOCOLS = ["http:", "https:"];
const DOMAIN_PATTERN = /^(?:(?!-)[a-z\d_-]+(?<!-)\.)+(?:[a-z]{2,}|xn--[a-z\d-]+)$/;
const IPV4_PATTERN = /^\d{1,3}(?:\.\d{1,3}){3}$/;

function isCompleteHost(hostname) {
  return DOMAIN_PATTERN.test(hostname) || IPV4_PATTERN.test(hostname);
}

function isWebLink(value) {
  try {
    const { protocol, hostname } = new URL(value);
    return SUPPORTED_PROTOCOLS.includes(protocol) && isCompleteHost(hostname);
  } catch {
    return false;
  }
}

function getLinkError({ url }) {
  const link = url.trim();

  if (link === "") return LINK_CHECK_MESSAGES.emptyLink;
  if (!isWebLink(link)) return LINK_CHECK_MESSAGES.invalidLink;
  return null;
}

export const linkCheckValidator = createValidator({
  url: getLinkError,
});
