import dbClient from './utils/db';
import { ObjectId } from 'mongodb'
async function del() {
  const users = await dbClient.findUsers();
  const userId = '66d58f0949ef59d2247829c8';
  const user = users.find(user => user._id.toString() === userId);
  console.log(user);
  console.log(typeof(user._id));
}
del();
