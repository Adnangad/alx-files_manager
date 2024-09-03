import dbClient from './utils/db';
import redisClient  from './utils/redis';
import { ObjectId } from 'mongodb'
async function del() {
  
  const files = await dbClient.findAllFiles();
  console.log(files);
  
}
del();