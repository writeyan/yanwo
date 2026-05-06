const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Post = require('./src/models/Post');
require('dotenv').config();

const seed = async () => {
  try {
    await connectDB();

    // 创建管理员
    let admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      admin = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        status: 'active'
      });
      console.log('✅ 管理员创建成功 (admin@example.com / admin123)');
    } else {
      console.log('ℹ️ 管理员已存在');
    }

    // 创建示例文章
    const existingPost = await Post.findOne({ slug: 'welcome-to-blog' });
    if (!existingPost) {
      await Post.create({
        title: '欢迎使用个人博客系统',
        slug: 'welcome-to-blog',
        content: '# Hello World\n\n这是你的第一篇博客文章。',
        author: admin._id,
        authorName: admin.username,
        status: 'published',
        publishedAt: new Date()
      });
      console.log('✅ 示例文章创建成功');
    } else {
      console.log('ℹ️ 示例文章已存在');
    }
  } catch (err) {
    console.error('❌ 种子脚本出错:', err);
  } finally {
    process.exit();
  }
};

seed();