import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { error } from 'console';

function hashPassword(password) {
  const sha1hash = crypto.createHash('sha1');
  sha1hash.update(password);
  return sha1hash.digest('hex');
}

exports.postNew = async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Missing email' });
  }
  if (!password) {
    res.status(400).json({ error: 'Missing password' });
  }
  const user = await dbClient.findUserbymail(email);
  if (user === null) {
    const hashPass = hashPassword(password);
    console.log(hashPass);
    try {
      const userId = await dbClient.insertUser(email, hashPass);
      res.status(201).json({ id: userId, email });
    } catch (error) {
      res.status(500).json({ error: 'failed to create new user' });
    }
  } else {
    res.status(400).json({ error: 'Already exist' });
  }
};
exports.getMe = async (req, res) => {
  const users = await dbClient.findUsers();
  const tokenheader = req.headers['x-token'];
  if (!tokenheader) {
    res.status(401).json({ message: 'Unauthorized' });
  }
  const key = `auth_${tokenheader}`;
  const userId = await redisClient.get(key);
  console.log(`User id is ${userId}`);
  console.log(typeof (userId));
  if (userId === null) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const person = users.find((user) => user._id.toString() === userId);
  return res.json({ id: person._id, email: person.email });
};
