<template>
  <li class="comment-node" :style="{ marginLeft: depth ? `${Math.min(depth, 4) * 14}px` : '0' }">
    <div class="comment-row">
      <div class="comment__av" :aria-label="node.authorName">
        {{ (node.authorName || '?').slice(0, 1) }}
      </div>
      <div class="comment__body">
        <p class="comment__meta">
          <strong class="comment__name">{{ node.authorName }}</strong>
          <time :datetime="node.createdAt" class="comment__time">{{ formatTime(node.createdAt) }}</time>
        </p>
        <p class="comment__text">{{ node.content }}</p>
        <div class="comment__actions">
          <button
            type="button"
            class="btn-icon"
            :class="{ 'btn-icon--on': node.likedByMe }"
            :disabled="likePending === node._id"
            :title="token ? (node.likedByMe ? '取消赞' : '点赞') : '点击去登录点赞'"
            @click="$emit('like', node._id)"
          >
            ♥ {{ node.likeCount ?? 0 }}
          </button>
          <button type="button" class="btn-text" @click="$emit('reply', node._id)">
            {{ replyingTo === node._id ? '取消回复' : '回复' }}
          </button>
          <button
            v-if="token"
            type="button"
            class="btn-text btn-text--muted"
            title="举报不当内容"
            @click="$emit('report', node._id)"
          >
            举报
          </button>
        </div>

        <div v-if="replyingTo === node._id" class="reply-box">
          <textarea
            v-model="localReply"
            class="input-text"
            rows="3"
            :placeholder="`回复 ${node.authorName}…`"
          />
          <div class="reply-box__bar">
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="replyPending === node._id"
              @click="submitReply"
            >
              {{ replyPending === node._id ? '发送中…' : '发送' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <ul v-if="node.replies?.length" class="comment-replies">
      <CommentItem
        v-for="ch in node.replies"
        :key="ch._id"
        :node="ch"
        :depth="depth + 1"
        :replying-to="replyingTo"
        :token="token"
        :like-pending="likePending"
        :reply-pending="replyPending"
        @like="$emit('like', $event)"
        @reply="$emit('reply', $event)"
        @submit-reply="$emit('submit-reply', $event)"
        @report="$emit('report', $event)"
      />
    </ul>
  </li>
</template>

<script setup>
import { ref, watch } from 'vue'
import CommentItem from './CommentItem.vue'

const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  replyingTo: { type: String, default: null },
  token: { type: String, default: '' },
  likePending: { type: String, default: null },
  replyPending: { type: String, default: null },
})

const emit = defineEmits(['like', 'reply', 'submit-reply', 'report'])

const localReply = ref('')

watch(
  () => props.replyingTo,
  (v) => {
    if (v !== props.node._id) localReply.value = ''
  }
)

const formatTime = (d) => (d ? new Date(d).toLocaleString() : '—')

const submitReply = () => {
  if (props.replyPending === props.node._id) return
  const text = localReply.value.trim()
  if (!text) return
  emit('submit-reply', { parentId: props.node._id, content: text })
  localReply.value = ''
}
</script>

<style scoped>
.comment-node {
  list-style: none;
}
.comment-row {
  display: flex;
  gap: 0.75rem;
  padding: 0.65rem 0 0.5rem;
  border-top: 1px solid #e8e0d6;
}
.comment-node:first-child > .comment-row {
  border-top: none;
  padding-top: 0;
}
.comment-replies {
  list-style: none;
  padding: 0 0 0 0.25rem;
  margin: 0;
  border-left: 2px solid #e4ddd4;
}
.comment__av {
  flex-shrink: 0;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 50%;
  background: var(--color-primary);
  color: #f5f0ea;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
}
.comment__body {
  min-width: 0;
  flex: 1;
}
.comment__meta {
  margin: 0 0 0.15rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.6rem;
  font-size: 0.82rem;
  color: var(--color-ink-muted);
}
.comment__name {
  color: #2d2d35;
  font-size: 0.92rem;
  font-weight: 600;
}
.comment__time {
  font-size: 0.78rem;
  color: #8a8a94;
}
.comment__text {
  margin: 0 0 0.35rem;
  font-size: 0.92rem;
  line-height: 1.6;
  color: #2f2f38;
  white-space: pre-wrap;
  word-break: break-word;
}
.comment__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}
.btn-icon {
  border: 1px solid var(--color-border);
  background: #fff;
  border-radius: 6px;
  padding: 0.2rem 0.5rem;
  font-size: 0.82rem;
  cursor: pointer;
  color: var(--color-ink-muted);
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.btn-icon:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-icon--on {
  color: #b83232;
  border-color: #e8a0a0;
  background: #fff5f5;
}
.btn-text {
  border: none;
  background: none;
  padding: 0.2rem 0.35rem;
  font-size: 0.82rem;
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.btn-text--muted {
  color: #8a8a94;
  text-decoration: none;
}
.btn-text--muted:hover {
  color: #c45c5c;
  text-decoration: underline;
}
.reply-box {
  margin-top: 0.6rem;
}
.reply-box .input-text {
  width: 100%;
  margin-bottom: 0.4rem;
}
.reply-box__bar {
  display: flex;
  justify-content: flex-end;
}
</style>
