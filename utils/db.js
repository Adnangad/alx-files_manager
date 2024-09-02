import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.db = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${this.host}:${this.port}`;
    this.client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    this.client
      .connect()
      .then(() => {
        console.log('successfully connected');
      })
      .catch((error) => {
        console.log(error);
      });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    try {
      const db = this.client.db(this.db);
      const collection = db.collection('users');
      const count = await collection.countDocuments();
      return count;
    } catch (error) {
      console.log('cannot get');
    }
  }

  async nbFiles() {
    try {
      const db = this.client.db(this.db);
      const collection = db.collection('files');
      const count = await collection.countDocuments();
      return count;
    } catch (error) {
      throw error;
    }
  }

  async findUserbymail(email) {
    try {
      const db = this.client.db(this.db);
      const collection = db.collection('users');
      const user = await collection.findOne({ email: `${email}` });
      return user;
    } catch (error) {
      throw error;
    }
  }

  async insertUser(email, password) {
    try {
      const db = this.client.db(this.db);
      const collection = db.collection('users');
      const doc = { email, password };
      const result = await collection.insertOne(doc);
      return result.insertedId;
    } catch (error) {
      throw error;
    }
  }

  async findUsers() {
    try {
      const db = this.client.db(this.db);
      const collection = db.collection('users');
      const rez = await collection.find({});
      const docs = await rez.toArray();
      return docs;
    } catch (error) {
      throw error;
    }
  }

  async delUser(email) {
    try {
      const db = this.client.db(this.db);
      const collection = db.collection('users');
      const rez = await collection.deleteOne({ email });
      if (rez.acknowledged) {
        return 1;
      }

      return 0;
    } catch (error) {
      throw error;
    }
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
