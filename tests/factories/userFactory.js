const mongoose = require('mongoose');
const User = mongoose.model('User');
const Blog = mongoose.model('Blog');

// Make a new user_id in mongodb and return it
const createUser = () => {
  return new User({}).save();
};

const deleteUser = (id) => {
  User.findByIdAndRemove(id, () => {});
  Blog.deleteMany({ _user: { _id: id } }, () => {});
};

module.exports = {
  createUser,
  deleteUser
};