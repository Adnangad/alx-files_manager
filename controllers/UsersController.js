import crypto from 'crypto';
import dbClient from '../utils/db';

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
