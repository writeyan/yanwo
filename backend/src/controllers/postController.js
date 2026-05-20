/**
 * 文章控制器：公开列表/详情/归档/标签/相关文章；登录用户 CRUD、点赞、封面上传、修订历史；
 * 管理员全量列表。软删除写审计。分类字段经 normalizeCategoryRef 校验为有效 ObjectId。
 */
const Category = require('../models/Category');
const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const PostFavorite = require('../models/PostFavorite');
const PostRevision = require('../models/PostRevision');
const slugify = require('slugify');
const { writeAudit } = require('../utils/auditLog');

/**
 * 将请求体中的 category 规范为 Category._id 或空
 *
 * @param {unknown} categoryField undefined/null 表示不传；空字符串表示清空
 * @returns {Promise<{ id?: import('mongoose').Types.ObjectId, err?: string }>}
 */
async function normalizeCategoryRef(categoryField) {
  if (categoryField === undefined || categoryField === null) return {};
  const s = String(categoryField).trim();
  if (!s) return { id: undefined };
  if (!/^[0-9a-fA-F]{24}$/.test(s)) return { err: '无效的分类 ID' };
  const c = await Category.findById(s).select('_id');
  if (!c) return { err: '分类不存在' };
  return { id: c._id };
}

// 后台：全部文章（可选 ?status=published|draft|deleted）
exports.getAllPostsAdmin = async (req, res) => {
  try {
    const raw = req.query.status && String(req.query.status).trim();
    const filter = {};
    if (raw && ['draft', 'published', 'deleted'].includes(raw)) {
      filter.status = raw;
    }
    const posts = await Post.find(filter)
      .populate('author', 'username')
      .populate('category', 'name slug')
      .sort({ updatedAt: -1 });
    return res.json({ code: 200, data: { posts } });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

// 作者/用户：仅查看自己的文章（含草稿）
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .populate('author', 'username')
      .populate('category', 'name slug')
      .sort({ updatedAt: -1 });
    return res.json({ code: 200, data: { posts } });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

// 标签云（已发布文章）
exports.getTagStats = async (req, res) => {
  try {
    const rows = await Post.aggregate([
      { $match: { status: 'published' } },
      { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return res.json({
      code: 200,
      data: rows.map((r) => ({ name: r._id, count: r.count })),
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

/** 列表排序：latest（默认）| popular | views */
const sortFromQuery = (sortRaw) => {
  const s = String(sortRaw || 'latest').toLowerCase();
  if (s === 'popular') return { likeCount: -1, publishedAt: -1 };
  if (s === 'views') return { viewCount: -1, publishedAt: -1 };
  return { publishedAt: -1 };
};

// 获取文章列表（公开）：支持排序、关键词（全文索引 / 正则回退）、标签
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, q, tag, category: catParam, sort: sortRaw } = req.query;
    const sortOpt = sortFromQuery(sortRaw);
    const base = { status: 'published' };
    if (tag && String(tag).trim()) {
      base.tags = String(tag).trim();
    }

    let categoryId = null;
    if (catParam && String(catParam).trim()) {
      const c = await Category.findOne({
        slug: String(catParam).trim(),
      }).select('_id');
      if (!c) {
        return res.json({
          code: 200,
          data: { posts: [], total: 0, page: 1, pages: 1 },
        });
      }
      categoryId = c._id;
      base.category = categoryId;
    }

    let query = { ...base };
    const qTrim = q && String(q).trim() ? String(q).trim() : '';

    if (qTrim) {
      let usedText = false;
      try {
        const textTry = { ...base, $text: { $search: qTrim } };
        const cnt = await Post.countDocuments(textTry);
        if (cnt > 0) {
          query = textTry;
          usedText = true;
        }
      } catch {
        usedText = false;
      }
      if (!usedText) {
        const escaped = qTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = new RegExp(escaped, 'i');
        query.$or = [{ title: rx }, { content: rx }, { excerpt: rx }];
      }
    }

    const lim = Math.min(50, Math.max(1, Number(limit) || 10));
    const pg = Math.max(1, Number(page) || 1);

    const posts = await Post.find(query)
      .populate('author', 'username')
      .populate('category', 'name slug')
      .sort(sortOpt)
      .skip((pg - 1) * lim)
      .limit(lim);

    const total = await Post.countDocuments(query);
    res.json({
      code: 200,
      data: { posts, total, page: pg, pages: Math.ceil(total / lim) || 1 },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
};

/** 推荐 / 相关文章：同标签优先，其次按热度 */
exports.getRelatedPosts = async (req, res) => {
  try {
    const { slug } = req.params;
    const cur = await Post.findOne({ slug, status: 'published' }).select('tags').lean();
    if (!cur) {
      return res.status(404).json({ code: 404, message: '文章不存在' });
    }
    const tags = (cur.tags || []).filter(Boolean);
    const filter = {
      status: 'published',
      _id: { $ne: cur._id },
      ...(tags.length ? { tags: { $in: tags } } : {}),
    };
    let posts = await Post.find(filter)
      .populate('author', 'username')
      .sort({ likeCount: -1, viewCount: -1, publishedAt: -1 })
      .limit(6)
      .lean();

    if (posts.length < 3 && tags.length) {
      posts = await Post.find({ status: 'published', _id: { $ne: cur._id } })
        .populate('author', 'username')
        .sort({ publishedAt: -1 })
        .limit(6)
        .lean();
    }

    return res.json({ code: 200, data: { posts } });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

/** 文章修订历史（作者或管理员） */
exports.getPostRevisions = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ code: 400, message: '无效的文章 ID' });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ code: 404, message: '文章不存在' });
    }
    const isOwner = String(post.author) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ code: 403, message: '无权查看修订记录' });
    }
    const revisions = await PostRevision.find({ post: postId })
      .sort({ createdAt: -1 })
      .limit(40)
      .populate('editedBy', 'username')
      .lean();
    return res.json({ code: 200, data: { revisions } });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

// 归档：仅返回基础信息并按年月分组
exports.getArchive = async (req, res) => {
  try {
    const posts = await Post.find({ status: 'published' })
      .select('title slug authorName publishedAt viewCount likeCount commentCount createdAt')
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    /** 按月分组（保留字段，前台可改用 byYear） */
    const groups = {};
    /** 按年分组（仅年份，满足简化归档需求） */
    const yearMap = {};
    const pushItem = (p) => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      authorName: p.authorName,
      publishedAt: p.publishedAt || p.createdAt,
      viewCount: p.viewCount || 0,
      likeCount: p.likeCount || 0,
      commentCount: p.commentCount || 0,
    });

    posts.forEach((p) => {
      const d = p.publishedAt || p.createdAt;
      const yearNum = d ? new Date(d).getFullYear() : null;
      const yearLabel = yearNum != null ? yearNum : '未知';
      const month = d ? String(new Date(d).getMonth() + 1).padStart(2, '0') : '00';
      const key = `${yearLabel}-${month}`;
      if (!groups[key]) {
        groups[key] = { key, year: typeof yearNum === 'number' ? yearNum : 0, month, posts: [] };
      }
      groups[key].posts.push(pushItem(p));

      const yKey = String(yearLabel);
      if (!yearMap[yKey]) {
        yearMap[yKey] = { year: yKey, posts: [] };
      }
      yearMap[yKey].posts.push(pushItem(p));
    });

    const archive = Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));

    const byYear = Object.values(yearMap).sort((a, b) => {
      if (a.year === '未知') return 1;
      if (b.year === '未知') return -1;
      return Number(b.year) - Number(a.year);
    });

    return res.json({ code: 200, data: { byYear, archive, total: posts.length } });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

// 获取单篇文章（公开，增加阅读量）；若有登录态则返回是否已点赞
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, status: 'published' })
      .populate('author', 'username')
      .populate('category', 'name slug description');
    if (!post) return res.status(404).json({ code: 404, message: '文章不存在' });
    post.viewCount += 1;
    await post.save();
    const obj = post.toObject ? post.toObject() : post;
    let likedByMe = false;
    let favoritedByMe = false;
    if (req.user) {
      const [like, fav] = await Promise.all([
        PostLike.findOne({ post: post._id, user: req.user._id }).lean(),
        PostFavorite.findOne({ post: post._id, user: req.user._id }).lean(),
      ]);
      likedByMe = !!like;
      favoritedByMe = !!fav;
    }
    obj.likedByMe = likedByMe;
    obj.favoritedByMe = favoritedByMe;
    obj.likeCount = obj.likeCount ?? 0;

    res.json({ code: 200, data: obj });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
};

// 需要登录：作者本人或管理员可按 ID 查看（含草稿）
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ code: 400, message: '无效的文章 ID' });
    }
    const post = await Post.findById(id).populate('author', 'username').populate('category', 'name slug');
    if (!post) return res.status(404).json({ code: 404, message: '文章不存在' });
    const isOwner = String(post.author?._id || post.author) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ code: 403, message: '无权查看该文章' });
    }
    return res.json({ code: 200, data: post });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

// 创建文章（需要登录）
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, tags, status, featuredImage } = req.body;
    if (!title || !content) {
      return res.status(400).json({ code: 400, message: '标题和内容不能为空' });
    }
    let slugBase = slugify(String(title), { lower: true, strict: true }).trim();
    if (!slugBase) {
      slugBase = `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
    let slug = slugBase;
    let n = 1;
    while (await Post.findOne({ slug })) {
      slug = `${slugBase}-${n++}`;
    }
    let categoryRef = undefined;
    const catResolved = await normalizeCategoryRef(category);
    if (catResolved.err) {
      return res.status(400).json({ code: 400, message: catResolved.err });
    }
    if (catResolved.id !== undefined) categoryRef = catResolved.id;

    const st = status || 'published';
    const post = await Post.create({
      title,
      slug,
      content,
      author: req.user._id,
      authorName: req.user.username,
      category: categoryRef,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
      status: st,
      featuredImage,
      publishedAt: st === 'published' ? Date.now() : null,
    });
    res.status(201).json({ code: 201, data: post });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ code: 400, message: '无效的文章 ID' });
    }
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ code: 404, message: '文章不存在' });
    }
    const isOwner = String(post.author) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ code: 403, message: '无权编辑' });
    }

    const { title, content, category, tags, status, featuredImage } = req.body;
    if (!title || !content) {
      return res.status(400).json({ code: 400, message: '标题和内容不能为空' });
    }

    await PostRevision.create({
      post: post._id,
      title: post.title,
      content: post.content,
      editedBy: req.user._id,
      editedByName: req.user.username || '',
    });

    const nextTitle = String(title).trim();
    if (nextTitle !== post.title) {
      let slugBase = slugify(nextTitle, { lower: true, strict: true }).trim();
      if (!slugBase) {
        slugBase = `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      }
      let slug = slugBase;
      let n = 1;
      while (await Post.findOne({ slug, _id: { $ne: post._id } })) {
        slug = `${slugBase}-${n++}`;
      }
      post.slug = slug;
    }

    const oldStatus = post.status;
    post.title = nextTitle;
    post.content = String(content);
    if ('category' in req.body) {
      if (category === null || category === undefined || String(category).trim() === '') {
        post.category = undefined;
      } else {
        const catResolved = await normalizeCategoryRef(category);
        if (catResolved.err) {
          return res.status(400).json({ code: 400, message: catResolved.err });
        }
        post.category = catResolved.id;
      }
    }
    post.tags = tags
      ? (Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim()).filter(Boolean))
      : [];
    post.status = status || post.status;
    post.featuredImage = featuredImage || undefined;
    if (oldStatus !== 'published' && post.status === 'published') {
      post.publishedAt = Date.now();
    }
    await post.save();

    return res.json({ code: 200, message: '更新成功', data: post });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

/** 上传文章封面图（仅路径，保存文章时写入 featuredImage） */
exports.uploadFeaturedCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择图片文件' });
    }
    const publicPath = `/uploads/featured/${req.file.filename}`;
    return res.json({ code: 200, message: '封面已上传', data: { featuredImage: publicPath } });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ code: 400, message: '无效的文章 ID' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ code: 404, message: '文章不存在' });
    }
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '无权删除' });
    }
    post.status = 'deleted';
    await post.save();
    await writeAudit({
      user: req.user._id,
      action: 'post.soft_delete',
      resourceType: 'post',
      resourceId: String(post._id),
      meta: { slug: post.slug, title: post.title },
      req,
    });
    return res.json({ code: 200, message: '已删除' });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};
