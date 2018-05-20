const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const cleanCache = require('../middlewares/cleanCache');
const keys = require('../config/keys');

const Blog = mongoose.model('Blog');
const startUrl = keys.startUrl;

module.exports = app => {
  app.get('/api/blogs/:id', requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user.id,
      _id: req.params.id
    });
    // given a document, res.send sends Document._doc. Need to reference it
    // directly to add data to it
    res.send({ ...blog._doc, startUrl });
  });

  app.get('/api/blogs', requireLogin, async (req, res) => {
      const blogs = await Blog.find({ _user: req.user.id }).cache({
        key: req.user.id,
      });
      res.send(blogs);
  });

  app.post('/api/blogs', requireLogin, cleanCache, async (req, res) => {
    const { title, content, imageUrl } = req.body;

    const blog = new Blog({
      imageUrl,
      title,
      content,
      _user: req.user.id
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      res.send(400, err);
    }
  });
};
