const THREAT_MESSAGES = {
  malware: "malware conhecido",
  phishing: "sinais de phishing",
};

function translateThreatTypes(categories) {
  const messages = (categories || [])
    .map((c) => THREAT_MESSAGES[c.toLowerCase()])
    .filter(Boolean);

  if (messages.length > 0) {
    return messages.join(", ");
  }

  return "atividade suspeita detectada";
}

function toVerificationStatus(checkResult) {
  if (!checkResult || checkResult.status !== "ready") {
    return { status: "pending" };
  }

  if (!checkResult.malicious) {
    return {
      status: "ready",
      verification: "Confiavel",
      message: "Nenhuma ameaca encontrada.",
    };
  }

  return {
    status: "ready",
    verification: "Suspeito",
    message: `Possivel risco: ${translateThreatTypes(checkResult.threat?.categories)}.`,
  };
}

module.exports = { toVerificationStatus };