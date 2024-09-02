import dbClient from '../utils/db.js'
import redisClient from '../utils/redis.js'

async function returnUsers() {
    const users = await dbClient.nbUsers();
    return users;
}
async function returnFiles() {
    const files = await dbClient.nbFiles();
    return files;
}
exports.getStatus = (req, res) => {
    res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive()})
}
exports.getTotal = async (req, res) => {
    try {
        // Wait for the results from the asynchronous functions
        const nbusers = await returnUsers();
        const nbfiles = await returnFiles();

        // Return the results in the response
        res.status(200).json({ users: nbusers, files: nbfiles });
    } catch (error) {
        // Handle any errors that occur during the asynchronous operations
        res.status(500).json({ error: 'Failed to retrieve totals' });
    }
}
