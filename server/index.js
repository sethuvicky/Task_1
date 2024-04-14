import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import { syncPosts, getPosts, syncPostsHandler, deletePost, updatePost } from './controllers/postcontroller.js';

const app = express();
app.use(cors());

const PORT = 5000;

mongoose.connect('mongodb+srv://sethu:sethu@cluster0.206kf.mongodb.net/task', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const storage = multer.diskStorage({});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

app.get('/api/posts', getPosts);
app.post('/api/posts/sync', syncPostsHandler);
app.delete('/api/posts/:id', deletePost);
app.post('/api/posts/:id', upload.single('image'), updatePost);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
