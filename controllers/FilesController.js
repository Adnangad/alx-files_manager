// controllers/FilesController.js
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

exports.postUpload = async (req, res) => {
  try {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.findUserById(ObjectId(userId));
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = '0', isPublic = false, data } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== '0') {
      const parentFile = await dbClient.findFilebyParent(ObjectId(parentId));
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    if (type === 'folder') {
      const newFolder = {
        userId: ObjectId(userId),
        name,
        type,
        isPublic,
        parentId: parentId === '0' ? '0' : ObjectId(parentId),
      };
      const fileId = await dbClient.createFile(newFolder);
      const folder = await dbClient.findFile({ _id: ObjectId(fileId) });
      return res.status(201).json(folder);
    } else {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const filename = uuidv4();
      const filePath = path.join(folderPath, filename);
      const fileBuffer = Buffer.from(data, 'base64');
      fs.writeFileSync(filePath, fileBuffer);

      const newFile = {
        userId: ObjectId(userId),
        name,
        type,
        isPublic,
        parentId: parentId === '0' ? '0' : ObjectId(parentId),
        localPath: filePath,
      };
      const fileId = await dbClient.createFile(newFile);
      const file = await dbClient.findFile({ _id: ObjectId(fileId) });
      return res.status(201).json(file);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
