<script setup>
import { ref } from "vue";
import UploadManager from "./UploadManager";

const fileInput = ref(null);
const progress = ref(0);
const status = ref("");

const uploadFile = async () => {
  if (!fileInput.value.files[0]) {
    alert("Please select a file");
    return;
  }

  const file = fileInput.value.files[0];
  const domainList = ["https://u1.local.com:3000", "https://u2.local.com:3000"];

  const uploader = new UploadManager(domainList);

  uploader.onProgress = (p) => {
    progress.value = Math.round(p * 100);
  };

  uploader.onComplete = () => {
    status.value = "Upload Complete!";
  };

  status.value = "Uploading...";
  progress.value = 0;

  // Start upload
  await uploader.upload(file);
};
</script>

<template>
  <div class="container">
    <h1>Large File Upload Demo</h1>

    <div class="upload-box">
      <input type="file" ref="fileInput" />
      <button @click="uploadFile">Upload</button>
    </div>

    <div v-if="status" class="status">
      {{ status }}
    </div>

    <div class="progress-bar-container" v-if="progress > 0">
      <div class="progress-bar" :style="{ width: progress + '%' }">
        {{ progress }}%
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Arial, sans-serif;
}

.upload-box {
  margin: 2rem 0;
  padding: 2rem;
  border: 2px dashed #ccc;
  border-radius: 8px;
  text-align: center;
}

button {
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #3aa876;
}

.progress-bar-container {
  width: 100%;
  height: 20px;
  background-color: #eee;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-bar {
  height: 100%;
  background-color: #42b983;
  color: white;
  text-align: center;
  font-size: 12px;
  line-height: 20px;
  transition: width 0.3s ease;
}

.status {
  margin-top: 1rem;
  font-weight: bold;
}
</style>
