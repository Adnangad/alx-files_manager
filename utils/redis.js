import { error } from 'console';
import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.clientIsConnect = true;
    this.client.on('error', (error) => {
      this.clientIsConnect = false;
      console.error(error);
    });
    this.client.on('connect', () => {
      this.clientIsConnect = true;
    });
    this.getVal = promisify(this.client.get).bind(this.client);
    this.setVal = promisify(this.client.set).bind(this.client);
    this.delVal = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.clientIsConnect;
  }

  async get(key) {
    try {
      const value = await this.getVal(key);
      return value;
    } catch (error) {
      return null;
    }
  }

  async set(key, value, time) {
    await this.setVal(key, value, 'EX', time);
  }

  async del(key) {
    await this.delVal(key);
  }
}
const redisClient = new RedisClient();
module.exports = redisClient;
