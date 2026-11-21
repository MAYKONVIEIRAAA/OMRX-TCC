const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel  = require("../models/user");
const emailVerificationService = require("../services/emailVerificationService");
const { EMAIL_VERIFICATION_MESSAGES } = require("../config/config");

async function create(req, resp) {
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    if (await userModel.findByEmail(email)) {
        return resp.status(409).json({error: "O Email já existe!"})
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const id = await userModel.create({ name, email, passwordHash});

    let emailSent = true;

    try {
        await emailVerificationService.sendVerificationEmail({ id, name, email });
    } catch (error) {
        console.error("Falha ao enviar e-mail de verificacao:", error.message);
        emailSent = false;
    }

    return resp.status(201).json({ id, name, email, emailSent })
}

async function rejectUnverifiedLogin(resp, user) {
    try {
        const resent = await emailVerificationService.resendIfTokenExpired(user);

        if (resent) {
            return resp.status(403).json({
                error: EMAIL_VERIFICATION_MESSAGES.EXPIRED_RESENT,
                code: "EMAIL_VERIFICATION_RESENT",
            });
        }

        return resp.status(403).json({
            error: EMAIL_VERIFICATION_MESSAGES.NOT_VERIFIED,
            code: "EMAIL_NOT_VERIFIED",
        });
    } catch (error) {
        console.error("Falha ao reenviar e-mail de verificacao no login:", error.message);
        return resp.status(502).json({ error: EMAIL_VERIFICATION_MESSAGES.EXPIRED_RESEND_FAILED });
    }
}

async function login(req, resp) {
    const id = req.id;
    const email = req.email;

    if (!req.emailVerified) {
        return rejectUnverifiedLogin(resp, { id, name: req.name, email });
    }

    const token = jwt.sign(
        { id, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN}
    );

    return resp.status(200).json({ token });
}

async function update(req, resp) {
    const id = req.auth.id;
    const { name, email, newPassword } = req.body;
    const fields = {};

    if (name) {
        fields.name = name.trim();
    }

    if (email) {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await userModel.findByEmail(normalizedEmail);

        if (existing && existing.user_id !== id) {
            return resp.status(409).json({ error: "Esse email já está em uso por outra conta." });
        }

        fields.email = normalizedEmail;
    }

    if (newPassword) {
        fields.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await userModel.update(id, fields);

    return resp.status(200).json({ id });
}

async function verifyEmail(req, resp) {
    try {
        await emailVerificationService.verifyEmail(req.body?.token);
        return resp.status(200).json({ message: EMAIL_VERIFICATION_MESSAGES.VERIFIED });
    } catch (error) {
        if (error instanceof emailVerificationService.EmailVerificationError) {
            return resp.status(400).json({
                error: EMAIL_VERIFICATION_MESSAGES[error.code],
                code: error.code,
            });
        }
        throw error;
    }
}

async function resendVerification(req, resp) {
    const email = req.body.email.trim().toLowerCase();

    try {
        await emailVerificationService.resendVerificationEmail(email);
    } catch (error) {
        console.error("Falha ao reenviar e-mail de verificacao:", error.message);
        return resp.status(502).json({ error: EMAIL_VERIFICATION_MESSAGES.SEND_FAILED });
    }

    return resp.status(200).json({ message: EMAIL_VERIFICATION_MESSAGES.RESEND_ACCEPTED });
}

module.exports = { create, login, update, verifyEmail, resendVerification }