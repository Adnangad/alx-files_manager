import dbClient from './utils/db';
import { ObjectId } from 'mongodb'
async function del() {
  try {
    await dbClient.delFiles(0);
    console.log('success');
  }
  catch(error) {
    throw error;
  }
  
}
del();
