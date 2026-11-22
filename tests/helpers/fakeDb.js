// Banco em memoria que imita o subconjunto de SQL usado pelos models
// (src/models/user.js, src/models/emailVerificationToken.js, src/models/passwordResetToken.js e src/models/verification.js).
// A comparacao de email e case-insensitive, como a collation padrao do MySQL.

function createFakeDb() {
  const state = { users: [], tokens: [], verifications: [], passwordResetTokens: [] };
  let userSeq = 0;
  let tokenSeq = 0;
  let verificationSeq = 0;
  let passwordResetTokenSeq = 0;

  const sameEmail = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

  async function execute(sql, params = []) {
    const q = sql.replace(/\s+/g, " ").trim();

    if (q.startsWith("INSERT INTO users")) {
      const [name, email, hash] = params;
      const row = {
        user_id: ++userSeq,
        user_name: name,
        user_email: email,
        senha_hash: hash,
        user_email_verified_at: null,
        user_created_at: new Date(),
      };
      state.users.push(row);
      return [{ insertId: row.user_id }];
    }

    if (q.startsWith("SELECT user_id FROM users WHERE user_email")) {
      const user = state.users.find((u) => sameEmail(u.user_email, params[0]));
      return [user ? [{ user_id: user.user_id }] : []];
    }

    if (/^SELECT \* FROM users where user_email/i.test(q)) {
      const user = state.users.find((u) => sameEmail(u.user_email, params[0]));
      return [user ? [{ ...user }] : []];
    }

    if (q.startsWith("SELECT * FROM users WHERE user_id")) {
      const user = state.users.find((u) => u.user_id === params[0]);
      return [user ? [{ ...user }] : []];
    }

    if (q.startsWith("UPDATE users SET user_name = COALESCE")) {
      const [name, email, passwordHash, resetVerification, id] = params;
      const user = state.users.find((u) => u.user_id === id);
      if (user) {
        if (name !== null) user.user_name = name;
        if (email !== null) user.user_email = email;
        if (passwordHash !== null) user.senha_hash = passwordHash;
        if (resetVerification) user.user_email_verified_at = null;
      }
      return [{ affectedRows: user ? 1 : 0 }];
    }

    if (q.startsWith("UPDATE users SET user_email_verified_at")) {
      const user = state.users.find((u) => u.user_id === params[0]);
      if (user) user.user_email_verified_at = new Date();
      return [{ affectedRows: user ? 1 : 0 }];
    }

    if (q.startsWith("DELETE FROM users WHERE user_id")) {
      const before = state.users.length;
      state.users = state.users.filter((u) => u.user_id !== params[0]);
      return [{ affectedRows: before - state.users.length }];
    }

    if (q.startsWith("INSERT INTO email_verification_tokens")) {
      const [userId, tokenHash, hours] = params;
      const now = Date.now();
      state.tokens.push({
        id: ++tokenSeq,
        user_id: userId,
        token_hash: tokenHash,
        created_at: new Date(now),
        expires_at: new Date(now + hours * 3600 * 1000),
      });
      return [{ insertId: tokenSeq }];
    }

    if (q.startsWith("SELECT user_id, expires_at < NOW() AS expired FROM password_reset_tokens")) {
      const token = state.passwordResetTokens.find((t) => t.token_hash === params[0]);
      return [
        token
          ? [{ user_id: token.user_id, expired: token.expires_at < new Date() ? 1 : 0 }]
          : [],
      ];
    }

    if (q.startsWith("SELECT user_id, expires_at < NOW()")) {
      const token = state.tokens.find((t) => t.token_hash === params[0]);
      return [
        token
          ? [{ user_id: token.user_id, expired: token.expires_at < new Date() ? 1 : 0 }]
          : [],
      ];
    }

    if (q.startsWith("SELECT 1 FROM email_verification_tokens")) {
      const now = new Date();
      const active = state.tokens.some((t) => t.user_id === params[0] && t.expires_at > now);
      return [active ? [{ 1: 1 }] : []];
    }

    if (q.startsWith("SELECT TIMESTAMPDIFF")) {
      const rows = state.tokens.filter((t) => t.user_id === params[0]);
      const seconds = rows.length
        ? Math.floor((Date.now() - Math.max(...rows.map((t) => t.created_at.getTime()))) / 1000)
        : null;
      return [[{ seconds }]];
    }

    if (q.startsWith("DELETE FROM email_verification_tokens")) {
      const before = state.tokens.length;
      state.tokens = state.tokens.filter((t) => t.user_id !== params[0]);
      return [{ affectedRows: before - state.tokens.length }];
    }

    if (q.startsWith("INSERT INTO password_reset_tokens")) {
      const [userId, tokenHash, hours] = params;
      const now = Date.now();
      state.passwordResetTokens.push({
        id: ++passwordResetTokenSeq,
        user_id: userId,
        token_hash: tokenHash,
        created_at: new Date(now),
        expires_at: new Date(now + hours * 3600 * 1000),
      });
      return [{ insertId: passwordResetTokenSeq }];
    }

    if (q.startsWith("DELETE FROM password_reset_tokens")) {
      const before = state.passwordResetTokens.length;
      state.passwordResetTokens = state.passwordResetTokens.filter((t) => t.user_id !== params[0]);
      return [{ affectedRows: before - state.passwordResetTokens.length }];
    }

    if (q.startsWith("INSERT INTO verifications")) {
      const [url, statusId, threatTypeId, userId] = params;
      const row = {
        id: ++verificationSeq,
        url,
        status_id: statusId,
        threat_type_id: threatTypeId,
        user_id: userId,
        created_at: new Date(),
      };
      state.verifications.push(row);
      return [{ insertId: row.id }];
    }

    if (q.startsWith("SELECT COUNT(*) AS total")) {
      const rows = state.verifications;
      const lastUpdatedAt = rows.length
        ? new Date(Math.max(...rows.map((r) => r.created_at.getTime())))
        : null;
      return [[{ total: rows.length, lastUpdatedAt }]];
    }

    throw new Error(`Query nao suportada pelo fake DB: ${q}`);
  }

  return {
    pool: { execute },

    reset() {
      state.users = [];
      state.tokens = [];
      state.verifications = [];
      state.passwordResetTokens = [];
      userSeq = 0;
      tokenSeq = 0;
      verificationSeq = 0;
      passwordResetTokenSeq = 0;
    },

    // --- helpers de inspecao e manipulacao usados pelos testes ---
    users: () => state.users,
    tokens: () => state.tokens,
    verifications: () => state.verifications,
    passwordResetTokens: () => state.passwordResetTokens,
    findUser: (email) => state.users.find((u) => sameEmail(u.user_email, email)),
    tokensOf: (userId) => state.tokens.filter((t) => t.user_id === userId),
    passwordResetTokensOf: (userId) =>
      state.passwordResetTokens.filter((t) => t.user_id === userId),

    verifyUser(email) {
      this.findUser(email).user_email_verified_at = new Date();
    },

    // Envelhece os tokens do usuario, simulando a passagem do tempo.
    ageTokens(userId, seconds) {
      for (const t of this.tokensOf(userId)) {
        t.created_at = new Date(t.created_at.getTime() - seconds * 1000);
      }
    },

    expireTokens(userId) {
      for (const t of this.tokensOf(userId)) {
        t.expires_at = new Date(Date.now() - 1000);
      }
    },

    expirePasswordResetTokens(userId) {
      for (const t of this.passwordResetTokensOf(userId)) {
        t.expires_at = new Date(Date.now() - 1000);
      }
    },
  };
}

module.exports = { createFakeDb };