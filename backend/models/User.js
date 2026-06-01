const crypto = require('crypto');
const mongoose = require('mongoose');

const PASSWORD_KEY_LENGTH = 64;

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, PASSWORD_KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      return resolve(derivedKey.toString('hex'));
    });
  });
}

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: { type: String, required: true },
  passwordSalt: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.methods.setPassword = async function setPassword(password) {
  this.passwordSalt = crypto.randomBytes(16).toString('hex');
  this.passwordHash = await scryptAsync(password, this.passwordSalt);
};

UserSchema.methods.verifyPassword = async function verifyPassword(password) {
  const candidateHash = await scryptAsync(password, this.passwordSalt);
  return crypto.timingSafeEqual(
    Buffer.from(candidateHash, 'hex'),
    Buffer.from(this.passwordHash, 'hex')
  );
};

module.exports = mongoose.model('User', UserSchema);
