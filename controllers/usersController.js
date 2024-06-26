const user = require("../model/user");

const getallusers = async (req, res) => {
  const users = await user.find();
  if (!users) return res.status(204).json({ message: "no users found" });
  res.json(users);
};

const deleteuser = async (req, res) => {
  if (!req?.body?.id)
    return res.status(400).json({ message: "user id required" });
  const user = await user.findone({ _id: req.body.id }).exec();
  if (!user) {
    return res
      .status(204)
      .json({ message: `user id ${req.body.id} not found` });
  }
  const result = await user.deleteone({ _id: req.body.id });
  res.json(result);
};

const getuser = async (req, res) => {
  if (!req?.params?.id)
    return res.status(400).json({ message: "user id required" });
  const user = await user.findone({ _id: req.params.id }).exec();
  if (!user) {
    return res
      .status(204)
      .json({ message: `user id ${req.params.id} not found` });
  }
  res.json(user);
};

module.exports = {
  getallusers,
  deleteuser,
  getuser,
};

