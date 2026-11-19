import { getJson } from "../api/httpClient.js";

export function getStats() {
  return getJson("/stats");
}
