import dbClient from './utils/db';
import redisClient  from './utils/redis';
import { ObjectId } from 'mongodb'
async function del() {
  const token = 'c8df177b-b398-47c5-9970-57f1400d86a9';
  if (!token) {
    console.log('no token');
  }
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  console.log(ObjectId(userId));
  const files = await dbClient.findAllFiles();
  console.log(files);
  const filter = {
    userId: ObjectId(userId),
  }
  const file =await dbClient.findFile(filter)
  console.log(file);
}
del();