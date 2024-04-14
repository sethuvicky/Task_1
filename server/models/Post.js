import mongoose from "mongoose";


const postSchema = new mongoose.Schema({
  title: String,
  body: String,
  image: String,
  jsonPlaceholderId: String,
}, { timestamps: true });


export default mongoose.model('Post', postSchema);
