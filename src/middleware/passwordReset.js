function validateForgotPassword(req, resp, next) {
  const { email } = req.body ?? {};

  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return resp.status(400).json({ error: "Email inválido." });
  }

  next();
}

function validateResetPassword(req, resp, next) {
  const { token, newPassword, confirmNewPassword } = req.body ?? {};

  if (!token || !newPassword || !confirmNewPassword) {
    return resp
      .status(400)
      .json({ error: "Informe o token, a nova senha e a confirmação da nova senha." });
  }

  if (newPassword.length < 8) {
    return resp.status(400).json({ error: "A nova senha deve ter ao menos 8 caracteres." });
  }

  if (newPassword !== confirmNewPassword) {
    return resp.status(400).json({ error: "A confirmação da nova senha não confere." });
  }

  next();
}

module.exports = { validateForgotPassword, validateResetPassword };