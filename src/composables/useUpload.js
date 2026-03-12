import { ref, computed } from 'vue';
import UploadManager from '../UploadManager';

export function useUpload(domainList, chunkSize = 2 * 1024 * 1024) {
  const progress = ref(0);
  const status = ref('idle'); // idle(空闲), hashing(计算哈希), uploading(上传中), merging(合并中), completed(完成), error(错误)
  const startTime = ref(0);
  const endTime = ref(0);
  const error = ref(null);
  const speed = ref(0); // MB/s

  const duration = computed(() => {
    if (startTime.value === 0) return 0;
    const end = endTime.value || Date.now();
    return ((end - startTime.value) / 1000).toFixed(2);
  });

  const uploadManager = new UploadManager(domainList, 6, chunkSize);

  // 覆盖 calculateHash 以追踪状态
  const originalCalculateHash = uploadManager.calculateHash.bind(uploadManager);
  uploadManager.calculateHash = async (file) => {
    status.value = 'hashing';
    return originalCalculateHash(file);
  };

  // 覆盖 uploadChunk 以追踪状态（如果需要），但 onProgress 已经足够
  uploadManager.onProgress = (p) => {
    if (status.value !== 'uploading') {
      status.value = 'uploading';
    }
    progress.value = Math.round(p * 100);
    
    // 计算速度
    const now = Date.now();
    const elapsed = (now - startTime.value) / 1000;
    if (elapsed > 0) {
      const uploadedMB = (p * uploadManager.totalSize) / (1024 * 1024);
      speed.value = (uploadedMB / elapsed).toFixed(2);
    }
  };

  uploadManager.onAllChunksUploaded = () => {
    // 所有分片上传完成时，停止计时
    endTime.value = Date.now();
  };

  uploadManager.onComplete = () => {
    status.value = 'completed';
    // endTime.value = Date.now(); // 合并完成的时间不再计入总耗时
    progress.value = 100;
  };

  // 我们需要拦截合并步骤以更新状态为 'merging'
  // 由于 mergeRequest 是在内部调用的，我们可以包装它或者仅仅依赖 100% 上传和完成之间的间隙。
  // 更清晰的方法是修改 UploadManager 以发出事件，但现在我们可以进行修补。
  const originalMergeRequest = uploadManager.mergeRequest.bind(uploadManager);
  uploadManager.mergeRequest = async () => {
    status.value = 'merging';
    return originalMergeRequest();
  };

  const startUpload = async (file, newChunkSize) => {
    if (!file) return;

    // 如果传入了新的分片大小，则更新
    if (newChunkSize && newChunkSize > 0) {
      uploadManager.chunkSize = newChunkSize;
      console.log('分片大小已更新为:', (newChunkSize / (1024 * 1024)).toFixed(2), 'MB');
    }
    
    // 重置状态
    progress.value = 0;
    status.value = 'idle';
    startTime.value = Date.now();
    endTime.value = 0;
    error.value = null;
    speed.value = 0;

    try {
      await uploadManager.upload(file);
    } catch (e) {
      status.value = 'error';
      error.value = e.message;
      console.error(e);
    }
  };

  return {
    progress,
    status,
    duration,
    speed,
    error,
    startUpload
  };
}
