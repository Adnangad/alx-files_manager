import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { v4: uuidv4 } = require('uuid');

function hashPassword(password) {
  const sha1hash = crypto.createHash('sha1');
  sha1hash.update(password);
  return sha1hash.digest('hex');
}

exports.getConnect = async (req, res) => {
  const users = await dbClient.findUsers();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const base64cred = authHeader.substring(6);

  const cred = Buffer.from(base64cred, 'base64').toString('utf-8');
  const [email, password] = cred.split(':');
  if (!email || !password) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  console.log(email, password);
  const hashedPass = hashPassword(password);
  const user = users.find((user) => user.email === email && user.password === hashedPass);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = uuidv4();
  const key = `auth_${token}`;
  await redisClient.set(key, user._id, 86400);
  return res.status(200).json({ token });
};
exports.getDisconnect = async (req, res) => {
  const users = await dbClient.findUsers();
  const tokenheader = req.headers['x-token'];
  if (!tokenheader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  console.log(tokenheader);
  const key = `auth_${tokenheader}`;
  const userId = await redisClient.get(key);
  console.log(userId);

  if (userId === null) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = users.find((user) => user._id.toString() === userId);
  if (user) {
    await redisClient.del(key);
    return res.status(204).end();
  }

  return res.status(401).json({ message: 'Unauthorized' });
};
