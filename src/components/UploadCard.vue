<script setup>
import { computed } from "vue";
import { useUpload } from "../composables/useUpload";

const props = defineProps({
  title: String,
  domainList: Array,
  color: {
    type: String,
    default: "#42b983",
  },
});

const { progress, status, duration, speed, error, startUpload } = useUpload(
  props.domainList
);

const statusText = computed(() => {
  switch (status.value) {
    case "idle":
      return "就绪";
    case "hashing":
      return "计算哈希中...";
    case "uploading":
      return "上传中...";
    case "merging":
      return "合并中...";
    case "completed":
      return "完成";
    case "error":
      return "错误";
    default:
      return status.value;
  }
});

const statusColor = computed(() => {
  if (status.value === "error") return "#ff4444";
  if (status.value === "completed") return props.color;
  return "#666";
});

const displayDomains = computed(() => {
  return props.domainList
    .map((d) => {
      try {
        return new URL(d).hostname;
      } catch (e) {
        return d;
      }
    })
    .join(", ");
});

// Expose startUpload to parent
defineExpose({
  startUpload,
  reset: () => {
    // Reset logic if needed, currently startUpload resets
  },
});
</script>

<template>
  <div class="card">
    <div class="header" :style="{ borderLeftColor: color }">
      <h3>{{ title }}</h3>
      <span class="badge" :style="{ backgroundColor: statusColor }">{{
        statusText
      }}</span>
    </div>

    <div class="stats">
      <div class="stat-item">
        <span class="label">耗时</span>
        <span class="value">{{ duration }}s</span>
      </div>
      <div class="stat-item">
        <span class="label">速度</span>
        <span class="value">{{ speed }} MB/s</span>
      </div>
      <div class="stat-item">
        <span class="label">进度</span>
        <span class="value">{{ progress }}%</span>
      </div>
    </div>

    <div class="progress-container">
      <div
        class="progress-bar"
        :style="{ width: progress + '%', backgroundColor: color }"
      ></div>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>

    <div class="domains">
      <small>使用域名: {{ displayDomains }}</small>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;
  border: 1px solid #f0f0f0;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-left: 4px solid #ccc;
  padding-left: 1rem;
}

h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.progress-container {
  height: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.error-msg {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.domains {
  margin-top: 1rem;
  color: #9ca3af;
  font-size: 0.75rem;
  border-top: 1px solid #f3f4f6;
  padding-top: 0.5rem;
}
</style>
