const UserModel = require("../models/user");
const bcrypt = require("bcryptjs");

async function validateRegister(req, resp, next) {
    const { name, email, password, repeatPassword } = req.body ?? {};

    if (!name || !email || !password || !repeatPassword) {
        return resp.status(400).json({ error: "Todos os campos são obrigatórios." })
    }

    if ([name, email, password, repeatPassword].some((value) => typeof value !== "string")) {
        return resp.status(400).json({ error: "Os campos devem ser texto." });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return resp.status(400).json({ error: "Email inválido." });
    }

    if (password.length < 8) {
        return resp.status(400).json({ error: "A senha deve ter ao menos 8 caracteres." });
    }

    if (password != repeatPassword) {
        return resp.status(400).json({ error: "As senhas digitadas devem ser as mesmas." });
    }

    next();
}

async function validateLogin(req, resp, next) {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
        return resp.status(401).json({ error: "Os campos email e senha são obrigatórios." });
    }

    if (typeof email !== "string" || typeof password !== "string") {
        return resp.status(401).json({ error: "Email ou senha inválidos" });
    }

    const user = await UserModel.findOneByEmail(email);

    const isPasswordValid = user
        ? await bcrypt.compare(password, user.senha_hash)
        : false;

    if (!user || !isPasswordValid) {
        return resp.status(401).json({ error: "Email ou senha inválidos" });
    }

    req.id = user.user_id;
    req.name = user.user_name;
    req.email = user.user_email;
    req.emailVerified = Boolean(user.user_email_verified_at);

    next();
}

async function validateUpdate(req, resp, next) {
    const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!name && !email && !newPassword) {
        return resp.status(400).json({ error: "Informe ao menos um campo para atualizar." });
    }

    if (name && !name.trim()) {
        return resp.status(400).json({ error: "Nome inválido." });
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        return resp.status(400).json({ error: "Email inválido." });
    }

    if (newPassword) {
        if (!currentPassword || !confirmNewPassword) {
            return resp.status(400).json({
                error: "Para alterar a senha, informe a senha atual, a nova senha e a confirmação da nova senha.",
            });
        }

        if (newPassword.length < 8) {
            return resp.status(400).json({ error: "A nova senha deve ter ao menos 8 caracteres." });
        }

        if (newPassword !== confirmNewPassword) {
            return resp.status(400).json({ error: "A confirmação da nova senha não confere." });
        }

        const user = await UserModel.findById(req.auth.id);
        const isCurrentPasswordValid = user
            ? await bcrypt.compare(currentPassword, user.senha_hash)
            : false;

        if (!isCurrentPasswordValid) {
            return resp.status(401).json({ error: "Senha atual incorreta." });
        }
    }

    next();
}

function validateResendVerification(req, resp, next) {
    const { email } = req.body ?? {};

    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
        return resp.status(400).json({ error: "Email inválido." });
    }

    next();
}

async function validateDeleteAccount(req, resp, next) {
    const { currentPassword, confirmDeletion } = req.body;

    if (!currentPassword || !confirmDeletion) {
        return resp.status(400).json({
            error: "Confirme a exclusão informando sua senha atual e marcando a caixa de confirmação.",
        });
    }

    const user = await UserModel.findById(req.auth.id);
    const isPasswordValid = user ? await bcrypt.compare(currentPassword, user.senha_hash) : false;

    if (!isPasswordValid) {
        return resp.status(401).json({ error: "Senha atual incorreta." });
    }

    next();
}

module.exports = { validateRegister, validateLogin, validateUpdate, validateResendVerification, validateDeleteAccount };