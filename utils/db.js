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
    const db = this.client.db(this.db);
    const collection = db.collection('users');
    const count = await collection.countDocuments();
    return count;
  }

  async nbFiles() {
    const db = this.client.db(this.db);
    const collection = db.collection('files');
    const count = await collection.countDocuments();
    return count;
  }

  async findUserbymail(email) {
    const db = this.client.db(this.db);
    const collection = db.collection('users');
    const user = await collection.findOne({ email: `${email}` });
    return user;
  }

  async insertUser(email, password) {
    const db = this.client.db(this.db);
    const collection = db.collection('users');
    const doc = { email, password };
    const result = await collection.insertOne(doc);
    return result.insertedId;
  }

  async findUsers() {
    const db = this.client.db(this.db);
    const collection = db.collection('users');
    const rez = await collection.find({});
    const docs = await rez.toArray();
    return docs;
  }

  async delUser(email) {
    try {
      const db = this.client.db(this.db);
      const collection = db.collection('users');
      await collection.deleteOne({ email });
    } catch (error) {
      console.error(error);
      throw new Error('could not delete user');
    }
  }

  async findAllFiles() {
    const db = this.client.db(this.db);
    const collection = db.collection('files');
    const rez = await collection.find({});
    const docs = await rez.toArray();
    return docs;
  }

  async findFilebyParent(parentId) {
    const db = this.client.db(this.db);
    const collection = db.collection('files');
    const rez = await collection.findOne({ parentId });
    return rez;
  }

  async findFile(filters) {
    const db = this.client.db(this.db);
    const collection = db.collection('files');
    const rez = await collection.findOne(filters);
    return rez;
  }

  async addFolderFile(name, type, parentId, isPublic) {
    const db = this.client.db(this.db);
    const collection = db.collection('files');
    const rez = await collection.insertOne({
      name, type, isPublic, parentId,
    });
    return rez.insertedId;
  }

  async addUserId(parentId, userId) {
    try {
      const db = this.client.db(this.db);
      const collection = db.collection('files');
      const filter = { parentId };
      const updated = { $set: { userId } };
      await collection.updateOne(filter, updated);
    } catch (error) {
      console.error(error);
      throw new Error('could not update user');
    }
  }

  async createFile(document) {
    const db = this.client.db(this.db);
    const collection = db.collection('files');
    const newFile = await collection.insertOne(document);
    return newFile.insertedId;
  }

  async delFiles(parentId) {
    try {
      const db = this.client.db(this.db);
      const collection = db.collection('files');
      await collection.deleteMany({ parentId });
    } catch (error) {
      console.error(error);
      throw new Error('could not delete file');
    }
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
