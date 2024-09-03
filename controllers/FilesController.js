import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import { promisify } from 'util';
import { contentType } from 'mime-types';
import fs from 'fs';
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
  console.log(data);
  if (!name) {
    return res.status(400).json({ error: 'Missing name' });
  }
  if (!type || !['folder', 'file', 'image'].includes(type)) {
    return res.status(400).json({ error: 'Missing type' });
  }
  if (!data && type !== 'folder') {
    return res.status(400).json({ error: 'Missing data' });
  }

  if (parentId !== 0) {
    const file = await dbClient.findFilebyParent(ObjectId(parentId));
    if (!file) {
      return res.status(400).json({ error: 'Parent not found' });
    }
    if (file.type !== 'folder') {
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
    const file = await dbClient.findFile({ _id: ObjectId(fileId) });
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
    parentId,
  });
};
const NULL_ID = Buffer.alloc(24, '0').toString('utf-8');
const ROOT_FOLDER_ID = 0;
const isValidId = (id) => ObjectId.isValid(id) && new ObjectId(id).toString() === id;

exports.getShow = async (req, res) => {
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const id = req.params ? req.params.id : NULL_ID;
  const file = await dbClient.findFile({
    _id: ObjectId(isValidId(id) ? id : NULL_ID),
    userId: ObjectId(isValidId(userId) ? userId : NULL_ID),
  });

  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }
  return res.status(200).json({
    id,
    userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId === ROOT_FOLDER_ID.toString()
      ? 0
      : file.parentId.toString(),
  });
};

exports.getIndex = async (req, res) => {
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const parentId = req.query.parentId || ROOT_FOLDER_ID.toString();
  const page = req.query.page || 0
    ? Number.parseInt(req.query.page, 10)
    : 0;
  const filesFilter = {
    userId: ObjectId(userId),
    parentId:
      parentId === ROOT_FOLDER_ID.toString()
        ? parentId
        : new ObjectId(
          isValidId(parentId) ? parentId : NULL_ID,
        ),
  };
  const pageSize = 20;

  const files = await dbClient.aggregateFiles(filesFilter, page, pageSize);
  return res.status(200).json(files);
};

exports.putPublish = async (req, res) => {
  const token = req.headers['x-token'];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const { id } = req.params;
  const query = {
    _id: ObjectId(id),
    userId: ObjectId(userId),
  };
  const befile = await dbClient.findFile(query);
  if (!befile) {
    res.status(404).json({ error: 'Not found' });
  }
  if (befile.isPublic === true) {
    res.status(200).json(befile);
  }
  const upd = { isPublic: true };
  await dbClient.update(query, upd);
  const file = await dbClient.findFile(query);
  res.status(200).json(file);
};

exports.putUnPublish = async (req, res) => {
  const token = req.headers['x-token'];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const { id } = req.params;
  const query = {
    _id: ObjectId(id),
    userId: ObjectId(userId),
  };
  const befile = dbClient.findFile(query);
  if (!befile) {
    res.status(404).json({ error: 'Not found' });
  }
  if (befile.isPublic === false) {
    res.status(200).json(befile);
  }
  const upd = { isPublic: false };
  await dbClient.update(query, upd);
  const file = await dbClient.findFile(query);
  res.status(200).json(file);
};

exports.getFile = async (req, res) => {
  const token = req.headers['x-token'];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const { id } = req.params;
  const query = {
    _id: ObjectId(id),
  };
  const file = await dbClient.findFile(query);
  if (!file) {
    res.status(404).json({ error: 'Not found' });
  }
  if (file.isPublic === false && !file.userId.equals(ObjectId(userId))) {
    res.status(404).json({ error: 'Not found' });
  }
  if (file.type === 'folder') {
    res.status(400).json({ error: "A folder doesn't have content" });
  }
  let filepath = file.localPath;
  if (fs.existsSync(filepath)) {
    const statz = promisify(fs.stat);
    const fileInf = await statz(filepath);
    if (!fileInf.isFile()) {
      res.status(404).json({ error: 'Not found' });
    }
  } else {
    res.status(404).json({ error: 'Not found' });
  }
  const realpat = promisify(fs.realpath);
  const absolutefp = await realpat(filepath);
  res.setHeader('Content-Type', contentType(file.name) || 'text/plain; charset=utf-8');
  res.status(200).sendFile(absolutefp);
};
