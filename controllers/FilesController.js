import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

exports.postUpload = async (req, res) => {
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const users = await dbClient.findUsers();
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  const user = users.find((user) => user._id.toString() === userId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    name, type, parentId = 0, isPublic = false, data,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Missing name' });
  }
  if (!type) {
    return res.status(400).json({ error: 'Missing type' });
  }
  if (!data && type !== 'folder') {
    return res.status(400).json({ error: 'Missing data' });
  }

  if (parentId !== 0) {
    const file = await dbClient.findFilebyParent(parentId);
    if (!file) {
      return res.status(400).json({ error: 'Parent not found' });
    }
    if (file.type !== 'folder') {
      return res.status(400).json({ error: 'Parent is not a folder' });
    }
  }

  if (type === 'folder') {
    const fileId = await dbClient.addFolderFile(name, type, parentId, isPublic);
    const file = await dbClient.findFile({ _id: fileId });
    return res.status(201).json(file);
  }
  const folderpath = process.env.FOLDER_PATH || '/tmp/files_manager';
  if (!fs.existsSync(folderpath)) {
    fs.mkdirSync(folderpath, { recursive: true });
  }
  const filename = uuidv4();
  const filpath = path.join(folderpath, filename);
  const fileBuff = Buffer.from(data, 'base64');

  try {
    fs.writeFileSync(filpath, fileBuff);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save file' });
  }

  const filedoc = {
    userId: ObjectId(userId),
    name,
    type,
    isPublic,
    parentId,
    localPath: filpath,
  };

  const newFileId = await dbClient.createFile(filedoc);
  return res.status(201).json({
    id: newFileId,
    userId,
    name,
    type,
    isPublic,
    parentId: parentId,
  });
};
