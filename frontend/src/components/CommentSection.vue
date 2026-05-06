<template>
  <section class="comments card">
    <div class="comments__head">
      <h2 class="comments__title">评论</h2>
      <span class="comments__n">{{ totalDisplay }} 条</span>
    </div>

    <p v-if="errorMsg" class="msg msg--err" role="alert">{{ errorMsg }}</p>
    <p v-else-if="message" class="msg msg--ok" role="status">{{ message }}</p>

    <form class="comment-form" @submit.prevent="submitTopComment">
      <label class="label" for="c-body">说点什么</label>
      <textarea
        id="c-body"
        v-model="content"
        class="input-text"
        required
        rows="4"
        :disabled="!canComment"
        placeholder="你的看法或补充…"
      />
      <div v-if="!userStore.token" class="comment-form__anon">
        <div class="form-row">
          <div class="form-col">
            <label class="label" for="a-name">昵称 *</label>
            <input
              id="a-name"
              v-model="authorName"
              class="input-text"
              type="text"
              required
              :disabled="!canComment"
            />
          </div>
          <div class="form-col">
            <label class="label" for="a-mail">邮箱 *</label>
            <input
              id="a-mail"
              v-model="authorEmail"
              class="input-text"
              type="email"
              required
              :disabled="!canComment"
            />
          </div>
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-sm" :disabled="!canComment || topSending">
        {{ topSending ? '发送中…' : '发表评论' }}
      </button>
    </form>

    <p v-if="!canComment" class="hint">正文加载完成后再来评论吧。</p>
    <p v-else-if="!loading && totalDisplay === 0" class="hint hint--soft">首评就是你。</p>

    <ul v-if="canComment && commentsList.length" class="comment-roots" aria-label="评论列表">
      <CommentItem
        v-for="node in commentTree"
        :key="node._id"
        :node="node"
        :depth="0"
        :replying-to="replyingTo"
        :token="userStore.token"
        :like-pending="likePending"
        :reply-pending="replyPending"
        @like="onCommentLike"
        @reply="onReply"
        @submit-reply="handleSubmitReply"
        @report="onReport"
      />
    </ul>

    <div v-if="canComment && hasMore && !loading" class="comment-more">
      <button type="button" class="btn btn-ghost btn-sm" :disabled="moreLoading" @click="loadMore">
        {{ moreLoading ? '加载中…' : '加载更多评论' }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getComments, createComment, toggleCommentLike, reportComment } from '../api/comment'
import { useUserStore } from '../store/user'
import CommentItem from './CommentItem.vue'

const props = defineProps({
  postId: { type: [String, Object], default: null },
})

const normalizeId = (id) => {
  if (id == null) return ''
  if (typeof id === 'string') return id
  if (typeof id === 'object' && id != null && typeof id.toString === 'function') return id.toString()
  return String(id)
}

const postId = computed(() => normalizeId(props.postId))

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const commentsList = ref([])
const content = ref('')
const authorName = ref('')
const authorEmail = ref('')
const loading = ref(false)
const topSending = ref(false)
const errorMsg = ref('')
const message = ref('')
const replyingTo = ref(null)
const likePending = ref(null)
const replyPending = ref(null)
const commentMeta = ref({ total: 0, page: 1, pages: 1 })
const moreLoading = ref(false)

const COMMENT_LIMIT = 28

const canComment = computed(() => !!postId.value)

const totalDisplay = computed(() => commentMeta.value.total || commentsList.value.length)

const hasMore = computed(() => {
  const m = commentMeta.value
  return m.page < m.pages
})

function buildTree(flat) {
  if (!flat?.length) return []
  const list = flat.map((c) => ({
    ...c,
    _id: String(c._id),
    parent: c.parent ? String(c.parent) : null,
    replies: [],
    likeCount: c.likeCount ?? 0,
    likedByMe: !!c.likedByMe,
  }))
  const map = {}
  list.forEach((c) => {
    map[c._id] = c
  })
  const roots = []
  list.forEach((c) => {
    if (c.parent && map[c.parent]) {
      map[c.parent].replies.push(c)
    } else {
      roots.push(c)
    }
  })
  const sortRec = (arr) => {
    arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    arr.forEach((x) => {
      if (x.replies?.length) sortRec(x.replies)
    })
  }
  sortRec(roots)
  return roots
}

const commentTree = computed(() => buildTree(commentsList.value))

const fetchComments = async (id, append = false) => {
  if (!id) {
    commentsList.value = []
    commentMeta.value = { total: 0, page: 1, pages: 1 }
    return
  }
  errorMsg.value = ''
  message.value = ''
  if (!append) {
    loading.value = true
    commentMeta.value = { total: 0, page: 1, pages: 1 }
  } else {
    moreLoading.value = true
  }
  try {
    const nextPage = append ? (commentMeta.value.page || 1) + 1 : 1
    const res = await getComments(id, { page: nextPage, limit: COMMENT_LIMIT })
    const list = res.data.data || []
    const meta = res.data.meta || {}
    if (append) {
      commentsList.value = [...commentsList.value, ...list]
    } else {
      commentsList.value = list
    }
    commentMeta.value = {
      total: meta.total ?? commentsList.value.length,
      page: meta.page ?? nextPage,
      pages: meta.pages ?? 1,
    }
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '加载评论失败'
    if (!append) commentsList.value = []
  } finally {
    loading.value = false
    moreLoading.value = false
  }
}

const loadMore = () => {
  if (!postId.value || !hasMore.value) return
  fetchComments(postId.value, true)
}

const onReport = async (id) => {
  if (!userStore.token) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  errorMsg.value = ''
  message.value = ''
  try {
    await reportComment(id)
    message.value = '感谢反馈，我们会尽快处理'
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '举报失败'
  }
}

const submitTopComment = async () => {
  if (!postId.value) return
  topSending.value = true
  errorMsg.value = ''
  message.value = ''
  try {
    const data = { postId: postId.value, content: content.value }
    if (!userStore.token) {
      data.authorName = authorName.value
      data.authorEmail = authorEmail.value
    }
    await createComment(data)
    content.value = ''
    if (!userStore.token) {
      authorName.value = ''
      authorEmail.value = ''
    }
    message.value = '已发布'
    await fetchComments(postId.value)
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '发表失败，请重试'
  } finally {
    topSending.value = false
  }
}

const onReply = (id) => {
  replyingTo.value = replyingTo.value === id ? null : id
}

const handleSubmitReply = async ({ parentId, content: text }) => {
  if (!postId.value || !text) return
  replyPending.value = parentId
  errorMsg.value = ''
  message.value = ''
  try {
    await createComment({
      postId: postId.value,
      content: text,
      parent: parentId,
    })
    replyingTo.value = null
    message.value = '已发布'
    await fetchComments(postId.value)
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '回复失败，请重试'
  } finally {
    replyPending.value = null
  }
}

const onCommentLike = async (id) => {
  if (!userStore.token) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  likePending.value = id
  errorMsg.value = ''
  try {
    await toggleCommentLike(id)
    await fetchComments(postId.value)
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '操作失败'
  } finally {
    likePending.value = null
  }
}

watch(
  postId,
  (id) => {
    if (id) fetchComments(id)
  },
  { immediate: true }
)
</script>

<style scoped>
.comments {
  margin-top: 2.5rem;
  padding: 1.35rem 1.2rem 1.5rem;
  border: 1px solid var(--color-border);
  background: #faf7f2;
  border-radius: var(--radius);
}
.comments__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--color-border);
}
.comments__title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0;
  letter-spacing: 0.06em;
}
.comments__n {
  font-size: 0.8rem;
  color: var(--color-ink-muted);
  font-weight: 500;
}
.msg {
  font-size: 0.9rem;
  margin: 0 0 0.6rem;
}
.msg--err {
  color: #9b2b2b;
}
.msg--ok {
  color: #0f5132;
}
.comment-form {
  margin-bottom: 1.2rem;
}
.comment-form__anon {
  margin: 0.6rem 0 0.75rem;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
@media (min-width: 500px) {
  .form-row {
    flex-direction: row;
    gap: 0.75rem;
  }
  .form-col {
    flex: 1;
    min-width: 0;
  }
}
.hint {
  color: var(--color-ink-muted);
  font-size: 0.9rem;
  margin: 0.5rem 0 0.8rem;
}
.hint--soft {
  text-align: center;
  font-style: italic;
}
.comment-more {
  margin-top: 1rem;
  text-align: center;
}
</style>
