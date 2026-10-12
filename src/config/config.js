module.exports = {
  ERROR_MESSAGES: {
    MISSING_API_KEY: "Servico de verificacao indisponivel no momento. Tente novamente mais tarde.",
    INVALID_URL: "Informe um link valido para verificar.",
    TIMEOUT: "A verificacao demorou demais. Tente novamente.",
    NETWORK_ERROR: "Nao foi possivel conectar ao servico de verificacao. Tente novamente.",
    API_ERROR: "Nao foi possivel verificar esse link agora. Tente novamente mais tarde.",
  },
  RETRY: {
    MAX_RETRIES: 2,
    INITIAL_DELAY_MS: 500,
  },
};