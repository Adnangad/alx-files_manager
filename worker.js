const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const dbClient = require('./utils/db');

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const fileDocument = await dbClient.filesCollection.findOne({ _id: ObjectId(fileId), userId });
  if (!fileDocument) throw new Error('File not found');

  const filePath = fileDocument.localPath;

  const sizes = [500, 250, 100];
  for (const size of sizes) {
    const thumbnail = await imageThumbnail(filePath, { width: size });
    fs.writeFileSync(`${filePath}_${size}`, thumbnail);
  }
});

module.exports = fileQueue;