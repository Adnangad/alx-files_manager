import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function returnUsers() {
  const users = await dbClient.nbUsers();
  return users;
}
async function returnFiles() {
  const files = await dbClient.nbFiles();
  return files;
}
exports.getStatus = (req, res) => {
  res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
};
exports.getTotal = async (req, res) => {
  try {
    const nbusers = await returnUsers();
    const nbfiles = await returnFiles();
    res.status(200).json({ users: nbusers, files: nbfiles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve totals' });
  }
};
