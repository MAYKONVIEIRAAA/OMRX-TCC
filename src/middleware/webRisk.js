function validateUrl(req, res, next) {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "O campo url e obrigatorio" });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "URL invalida" });
  }

  next();
}

module.exports = { validateUrl };