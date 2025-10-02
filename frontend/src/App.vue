<template>
  <div class="container">
    <h2 class="title">局域网 Web 打印平台</h2>
    <el-card class="box-card" shadow="never" style="margin-top: 12px;">
      <template #header>
        <div class="card-header">
          <span>上传文件</span>
        </div>
      </template>
      <el-upload
        class="upload-demo"
        drag
        :http-request="customUpload"
        name="file"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :show-file-list="false"
        accept=".pdf,.jpg,.jpeg,.png"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处，或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 PDF、JPG、PNG，最大 50MB</div>
        </template>
      </el-upload>
    </el-card>

    <el-row :gutter="16" class="main-grid">
      <el-col :xs="24" :md="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>文件列表</span>
            </div>
          </template>
          <el-empty v-if="files.length === 0" description="暂无文件" />
          <div v-else class="file-list">
            <div v-for="f in files" :key="f.id" class="file-item" @click="selectFile(f)" :class="{ active: current && current.id === f.id }">
              <el-icon><document /></el-icon>
              <span class="name">{{ f.name }}</span>
              <el-button size="large" class="print-btn" @click.stop="printFile(f)">打印</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>预览</span>
            </div>
          </template>
          <div v-if="!current" class="preview-empty">
            选择一个文件以预览
          </div>
          <div v-else class="preview-box">
            <template v-if="isImage(current)">
              <img :src="`${BASE_URL}/api/preview/${current.id}`" alt="preview" style="max-width:100%; max-height:100%; object-fit:contain;" />
            </template>
            <template v-else>
              <div class="pdf-toolbar">
                <el-button size="small" @click="openPdfInNewTab(current)">在新窗口打开 PDF</el-button>
              </div>
              <iframe :src="pdfViewerUrl(current)" allowfullscreen allow="fullscreen" class="pdf-iframe"></iframe>
            </template>
          </div>
        </el-card>
      </el-col>
    </el-row>

  <el-card shadow="never" class="queue-card">
      <template #header>
        <span>打印队列</span>
      </template>
      <el-button size="small" @click="loadQueue">刷新队列</el-button>
      <el-table :data="queue" style="width: 100%; margin-top: 8px;" size="small">
        <el-table-column prop="line" label="任务" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document } from '@element-plus/icons-vue'
import api from './api'

const BASE_URL = api.defaults.baseURL.replace(/\/$/, '')

const files = ref([])
const current = ref(null)
const queue = ref([])

async function fetchFiles() {
  const { data } = await api.get('/api/files')
  files.value = data
}

function handleUploadSuccess(res) {
  ElMessage.success('上传成功')
  fetchFiles()
}

function handleUploadError(err) {
  console.error(err)
  ElMessage.error('上传失败')
}

function selectFile(f) {
  current.value = f
}

function isImage(f) {
  return f.mimetype && f.mimetype.startsWith('image/')
}

function pdfViewerUrl(f) {
  // 直接嵌入后端的 PDF 资源，避免跨域与混合内容问题
  return `${BASE_URL}/api/preview/${f.id}`
}

function openPdfInNewTab(f) {
  const url = pdfViewerUrl(f)
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function printFile(f) {
  try {
    const { data } = await api.post(`/api/print/${f.id}`)
    ElMessage.success(`已提交打印：${data.message || ''}`)
    loadQueue()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || e.message)
  }
}

async function loadQueue() {
  const { data } = await api.get('/api/queue')
  queue.value = (data.jobs || []).map(line => ({ line }))
}

onMounted(() => {
  fetchFiles()
  loadQueue()
})

// 自定义 axios 上传
async function customUpload({ file, onProgress, onError, onSuccess }) {
  try {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/api/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress({ percent: Math.round((evt.loaded / evt.total) * 100) })
        }
      }
    })
    onSuccess && onSuccess(data)
  } catch (e) {
    onError && onError(e)
  }
}
</script>

<style scoped>
.container { max-width: 1100px; margin: 16px auto; padding: 0 12px; }
.title { font-size: 20px; margin: 8px 0 12px; }
.main-grid { margin-top: 12px; }
.file-list { display: flex; flex-direction: column; gap: 8px; }
.file-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; cursor: pointer; }
.file-item:hover { background: #f5f7fa; }
.file-item.active { background: #ecf5ff; }
.name { flex: none; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.print-btn { margin-left: auto; }
.preview-empty { height: 600px; display:flex; align-items:center; justify-content:center; color:#999; }
.preview-box { height: 600px; }
.pdf-toolbar { display: flex; justify-content: flex-end; margin-bottom: 6px; }
.pdf-iframe { border: none; width: 100%; height: calc(100% - 32px); }
.queue-card { margin-top: 12px; }

@media (max-width: 768px) {
  .title { font-size: 18px; }
  .name { max-width: 150px; }
  .preview-empty { height: 70vh; }
  .preview-box { height: 70vh; }
}
</style>
