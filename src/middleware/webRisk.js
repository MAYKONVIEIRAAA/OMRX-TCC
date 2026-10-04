function validateUrl(req, res, next) {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({
      error: "O campo URL é obrigatório."
    });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({
      error: "URL inválida."
    });
  }

  next();
}

module.exports = { validateUrl };