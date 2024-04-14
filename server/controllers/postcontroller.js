import Post from '../models/Post.js';
import cloudinary from 'cloudinary';
import fetch from 'node-fetch';

cloudinary.config({
    cloud_name: 'dgnygjran',
    api_key: '313199661913892',
    api_secret: 'LnwAYXX-1yWGathoE6xgYRS9wkw',
});

export const syncPosts = async () => {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    const data = await response.json();

    const jsonPlaceholderIds = data.map(post => post.id.toString());

    let dbPosts = await Post.find();

    for (const dbPost of dbPosts) {
        if (!jsonPlaceholderIds.includes(dbPost.jsonPlaceholderId.toString())) {
            await Post.findByIdAndDelete(dbPost._id);
        }
    }

    for (const post of data) {
        const existingPost = await Post.findOne({ jsonPlaceholderId: post.id });

        if (!existingPost) {
            await new Post({
                title: post.title,
                body: post.body,
                image: post.image,
                jsonPlaceholderId: post.id
            }).save();
        }
    }

    dbPosts = await Post.find().sort({ createdAt: -1 });
};

export const getPosts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const searchQuery = req.query.search || '';

    const ITEMS_PER_PAGE = 10;

    const totalPosts = await Post.countDocuments({
        title: { $regex: new RegExp(searchQuery, 'i') },
    });

    const posts = await Post.aggregate([
        {
            $match: {
                title: { $regex: new RegExp(searchQuery, 'i') },
            },
        },
        {
            $addFields: {
                jsonPlaceholderIdInt: { $toInt: '$jsonPlaceholderId' },
            },
        },
        {
            $sort: { jsonPlaceholderIdInt: 1 },
        },
        {
            $skip: (page - 1) * ITEMS_PER_PAGE,
        },
        {
            $limit: ITEMS_PER_PAGE,
        },
        {
            $project: {
                jsonPlaceholderIdInt: 0,
            },
        },
    ]);

    res.json({
        posts,
        totalPages: Math.ceil(totalPosts / ITEMS_PER_PAGE),
        currentPage: page,
    });
};

export const syncPostsHandler = async (req, res) => {
    await syncPosts();
    res.json({ message: 'Sync completed!' });
};

export const deletePost = async (req, res) => {
    const id = req.params.id;
    await Post.findByIdAndDelete(id);
    res.json({ message: 'Post deleted!' });
};

export const updatePost = async (req, res) => {
    try {
        const id = req.params.id;
        const post = await Post.findById(id);

        if (post) {
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path);
                post.image = result.secure_url;
            }

            if (req.body.title) {
                post.title = req.body.title;
            }

            if (req.body.body) {
                post.body = req.body.body;
            }

            await post.save();
            res.json({
                message: 'Post updated!',
                updatedPost: {
                    title: post.title,
                    body: post.body,
                    image: post.image,
                },
            });
        } else {
            res.status(404).json({ message: 'Post not found!' });
        }
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ message: 'Failed to update post.' });
    }
};
