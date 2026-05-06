const Category = require('../models/Category');
const slugify = require('slugify');

exports.getCategories = async (req, res) => {
  const categories = await Category.find().sort('name');
  res.json({ code: 200, data: categories });
};

exports.createCategory = async (req, res) => {
  const { name, description } = req.body;
  const slug = slugify(name, { lower: true, strict: true });
  const category = await Category.create({ name, slug, description });
  res.status(201).json({ code: 201, data: category });
};

exports.updateCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ code: 404, message: '分类不存在' });
  category.name = req.body.name || category.name;
  category.slug = slugify(category.name, { lower: true, strict: true });
  category.description = req.body.description || category.description;
  await category.save();
  res.json({ code: 200, data: category });
};

exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ code: 200, message: '删除成功' });
};