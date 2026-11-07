const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel  = require("../models/user");

async function create(req, resp) {
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    if (await userModel.findByEmail(email)) {
        return resp.status(409).json({error: "O Email já existe!"})
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const id = await userModel.create({ name, email, passwordHash});

    return resp.status(201).json({ id, name, email })
}

async function login(req, resp) {
    const id = req.id;
    const email = req.email;

    const token = jwt.sign(
        { id, email },
        process.env.jwt_secret,
        { expiresIn: process.env.jwt_expires_in}
    );

    return resp.status(200).json({ token });
}

async function update(req, resp) {
    const id = Number(req.params.id);

    if (id !== req.auth.id) {
        return resp.status(403).json({ error: "Você só pode alterar seus próprios dados." });
    }

    const { name, email, password } = req.body;
    const fields = {};

    if (name !== undefined) {
        fields.name = name.trim();
    }

    if (email !== undefined) {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await userModel.findByEmail(normalizedEmail);

        if (existing && existing.user_id !== id) {
            return resp.status(409).json({ error: "O Email já existe!" });
        }

        fields.email = normalizedEmail;
    }

    if (password !== undefined) {
        fields.passwordHash = await bcrypt.hash(password, 10);
    }

    await userModel.update(id, fields);

    const user = await userModel.findById(id);

    return resp.status(200).json({
        id: user.user_id,
        name: user.user_name,
        email: user.user_email,
    });
}

module.exports = { create, login, update }