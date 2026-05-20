/**
 * 文章分类 CRUD（管理员写、公开读）
 *
 * slug 由名称经 slugify 生成，用于前台按分类筛选文章；name/slug 在模型层唯一索引。
 */
const Category = require('../models/Category');
const slugify = require('slugify');

/** 公开：全部分类，按名称排序 */
exports.getCategories = async (req, res) => {
  const categories = await Category.find().sort('name');
  res.json({ code: 200, data: categories });
};

/** 管理员：创建分类；重复 name/slug 时 Mongo 抛 11000 */
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

/** 管理员：按 ID 更新名称（会重算 slug）或描述 */
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

/** 管理员：删除分类；若仍有 Post 引用该分类则拒绝，避免孤儿数据 */
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
