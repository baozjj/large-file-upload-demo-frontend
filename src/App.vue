<script setup>
import { ref } from "vue";
import UploadCard from "./components/UploadCard.vue";

const file = ref(null);
const fileInput = ref(null);
const singleUploader = ref(null);
const multiUploader = ref(null);
const chunkSizeMB = ref(2); // 默认 2MB

const onFileChange = (e) => {
  if (e.target.files && e.target.files[0]) {
    file.value = e.target.files[0];
  }
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const getChunkSize = () => {
  return chunkSizeMB.value * 1024 * 1024;
};

const runSingle = () => {
  if (!file.value) return alert("请先选择文件");
  singleUploader.value.startUpload(file.value, getChunkSize());
};

const runMulti = () => {
  if (!file.value) return alert("请先选择文件");
  multiUploader.value.startUpload(file.value, getChunkSize());
};

const runBoth = () => {
  if (!file.value) return alert("请先选择文件");
  const size = getChunkSize();
  singleUploader.value.startUpload(file.value, size);
  multiUploader.value.startUpload(file.value, size);
};

// 策略 A: 单域名
const singleDomainList = ["https://u1.local.com:3000"];

// 策略 B: 多域名 (域名分片)
const multiDomainList = [
  "https://u1.local.com:3000",
  "https://u2.local.com:3000",
  "https://u3.local.com:3000",
  // 如果 hosts/cert 支持，可以添加更多，浏览器通常限制每个域名的并发数
  // 但这里我们使用不同域名来绕过每个域名的限制。
];
</script>

<template>
  <div class="app-container">
    <header>
      <h1>大文件上传演示</h1>
      <p class="subtitle">HTTP/2 多路复用 vs 域名分片</p>
    </header>

    <main>
      <!-- 文件选择区域 -->
      <section
        class="file-section"
        @click="triggerFileInput"
        :class="{ 'has-file': file }"
      >
        <input
          type="file"
          ref="fileInput"
          @change="onFileChange"
          style="display: none"
        />
        <div class="file-content">
          <div v-if="!file" class="placeholder">
            <span class="icon">📂</span>
            <span>点击或拖拽文件到此处上传</span>
          </div>
          <div v-else class="file-info">
            <span class="icon">📄</span>
            <div class="details">
              <span class="filename">{{ file.name }}</span>
              <span class="filesize"
                >{{ (file.size / (1024 * 1024)).toFixed(2) }} MB</span
              >
            </div>
            <button class="change-btn" @click.stop="triggerFileInput">
              更换文件
            </button>
          </div>
        </div>
      </section>

      <!-- 操作按钮 -->
      <section class="actions" v-if="file">
        <div class="settings">
          <label>分片大小 (MB):</label>
          <input type="number" v-model="chunkSizeMB" min="1" step="1" />
        </div>
        <div class="buttons">
          <button class="btn btn-primary" @click="runSingle">
            运行单域名策略
          </button>
          <button class="btn btn-secondary" @click="runMulti">
            运行多域名策略
          </button>
          <button class="btn btn-outline" @click="runBoth">
            同时运行对比 (竞速)
          </button>
        </div>
      </section>

      <!-- 卡片网格 -->
      <section class="cards-grid">
        <UploadCard
          ref="singleUploader"
          title="策略 A：单域名"
          :domainList="singleDomainList"
          color="#3b82f6"
        />
        <UploadCard
          ref="multiUploader"
          title="策略 B：域名分片"
          :domainList="multiDomainList"
          color="#10b981"
        />
      </section>
    </main>

    <footer>
      <p>
        <strong>注意：</strong>
        策略 A 使用单 HTTP/2 连接（多路复用）。 策略 B 使用多个域名开启并行的
        TCP 连接。
      </p>
    </footer>
  </div>
</template>

<style>
:root {
  --primary: #3b82f6;
  --secondary: #10b981;
  --bg: #f8fafc;
  --text: #1e293b;
  --text-light: #64748b;
}

body {
  margin: 0;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
  background-color: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}
</style>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  text-align: center;
  margin-bottom: 3rem;
}

h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--text-light);
  font-size: 1.1rem;
}

.file-section {
  background: white;
  border: 2px dashed #cbd5e1;
  border-radius: 1rem;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 2rem;
  text-align: center;
}

.file-section:hover {
  border-color: var(--primary);
  background: #f0f9ff;
}

.file-section.has-file {
  border-style: solid;
  border-color: #e2e8f0;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--text-light);
}

.placeholder .icon {
  font-size: 3rem;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.file-info .icon {
  font-size: 2.5rem;
}

.details {
  text-align: left;
}

.filename {
  display: block;
  font-weight: 600;
  font-size: 1.1rem;
}

.filesize {
  color: var(--text-light);
  font-size: 0.9rem;
}

.change-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.change-btn:hover {
  background: #f1f5f9;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.settings {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.settings input {
  padding: 0.25rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.25rem;
  width: 60px;
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--secondary);
  color: white;
}

.btn-secondary:hover {
  background: #059669;
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--text);
  color: var(--text);
}

.btn-outline:hover {
  background: var(--text);
  color: white;
  transform: translateY(-1px);
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr 1fr;
  }
}

footer {
  margin-top: auto;
  padding-top: 3rem;
  text-align: center;
  color: var(--text-light);
  font-size: 0.9rem;
}
</style>
