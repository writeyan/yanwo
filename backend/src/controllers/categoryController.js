const Category = require('../models/Category');
const slugify = require('slugify');

exports.getCategories = async (req, res) => {
  const categories = await Category.find().sort('name');
  res.json({ code: 200, data: categories });
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const n = String(name || '').trim();
    if (!n) return res.status(400).json({ code: 400, message: '分类名称不能为空' });
    const slug = slugify(n, { lower: true, strict: true }) || `cat-${Date.now()}`;
    const category = await Category.create({
      name: n,
      slug,
      description: description != null ? String(description).trim() : '',
    });
    res.status(201).json({ code: 201, data: category });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ code: 400, message: '分类名称或 slug 已存在' });
    }
    res.status(500).json({ code: 500, message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ code: 404, message: '分类不存在' });
    const nameRaw = req.body.name != null ? String(req.body.name).trim() : '';
    if (nameRaw) {
      category.name = nameRaw;
      category.slug = slugify(category.name, { lower: true, strict: true }) || category.slug;
    }
    if (req.body.description !== undefined) {
      category.description = String(req.body.description || '').trim();
    }
    await category.save();
    res.json({ code: 200, data: category });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ code: 400, message: '分类名称与其他分类冲突' });
    }
    res.status(500).json({ code: 500, message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const Post = require('../models/Post');
    const cid = req.params.id;
    const inUse = await Post.exists({ category: cid });
    if (inUse) {
      return res.status(400).json({ code: 400, message: '该分类仍有关联文章，无法删除' });
    }
    await Category.findByIdAndDelete(cid);
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
};