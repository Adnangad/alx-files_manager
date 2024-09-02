import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

exports.postUpload = async (req, res) => {
  const token = req.headers['x-token'];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const users = await dbClient.findUsers();
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  const user = users.find((user) => user._id.toString() === userId);
  if (userId === null || !user) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const {
    name, type, parentId = 0, isPublic = false, data,
  } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Missing name' });
  }
  if (!type) {
    res.status(400).json({ error: 'Missing type' });
  }
  if (!data && type !== 'folder') {
    res.status(400).json({ error: 'Missing data' });
  }
  if (parentId !== 0) {
    const file = await dbClient.findFilebyParent(parentId);
    console.log(file);
    if (file === null) {
      res.status(400).json({ error: 'Parent not found' });
    }
    if (file.type !== 'folder') {
      res.status(400).json({ error: 'Parent is not a folder' });
    }
  }
  if (type === 'folder') {
    const fileId = await dbClient.addFolderFile(name, type, parentId, isPublic);
    console.log(typeof (fileId));
    const files = await dbClient.findAllFiles();
    const file = files.find((file) => file._id.toString() === fileId.toString());
    console.log(file);
    res.status(201).json(file);
  } else {
    const folderpath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderpath)) {
      fs.mkdirSync(folderpath, { recursive: true });
    }
    const filename = uuidv4();
    const filpath = path.join(folderpath, filename);
    const fileBuff = Buffer.from(data, 'base64');
    fs.writeFileSync(filpath, fileBuff);
    const filedoc = {
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath: filpath,
    };
    const newFile = dbClient.createFile(filedoc);
    res.status(201).json(newFile);
  }
};
