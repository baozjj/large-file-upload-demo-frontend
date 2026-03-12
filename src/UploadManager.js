import axios from 'axios';
import SparkMD5 from 'spark-md5';

class UploadManager {
  constructor(domainList, concurrency = 6, chunkSize = 2 * 1024 * 1024) {
    this.domainList = domainList; // 域名列表
    this.concurrency = concurrency; // 并发数
    this.queue = []; // 任务队列
    this.activeCount = 0; // 当前活跃的请求数
    this.totalSize = 0; // 文件总大小
    this.uploadedSize = 0; // 已上传大小
    this.onProgress = null; // 进度回调
    this.onComplete = null; // 完成回调
    this.onAllChunksUploaded = null; // 所有分片上传完毕回调（未合并）
    this.chunkSize = chunkSize; // 每个分片大小，默认为 2MB
    this.fileHash = null; // 文件哈希
    this.fileName = null; // 文件名
  }

  /**
   * 开始上传文件
   * @param {File} file - 要上传的文件对象
   */
  async upload(file) {
    this.totalSize = file.size;
    this.uploadedSize = 0;
    this.fileName = file.name;

    // 先计算哈希
    console.log('正在计算文件哈希...');
    this.fileHash = await this.calculateHash(file);
    console.log('文件哈希:', this.fileHash);

    const chunks = this.createChunks(file);
    
    // 为每个分片创建任务
    const tasks = chunks.map((chunk, index) => {
      // 轮询策略：根据分片索引取模，决定使用哪个域名
      const domainIndex = index % this.domainList.length;
      const domain = this.domainList[domainIndex];
      return () => this.uploadChunk(chunk, index, domain);
    });

    // 添加任务到队列
    this.queue.push(...tasks);
    
    // 开始处理
    this.processQueue();
  }

  /**
   * 计算文件哈希 (简单版：时间戳 + 文件名)
   * @param {File} file - 文件对象
   * @returns {Promise<string>} - 文件哈希值
   */
  async calculateHash(file) {
    // 为了演示性能，改为简单的 hash 生成方式
    // 实际生产中应使用文件内容 hash (如 spark-md5)
    return new Promise((resolve) => {
        const spark = new SparkMD5();
        spark.append(file.name + Date.now().toString());
        resolve(spark.end());
    });
  }

  /**
   * 将文件切分为分片
   * @param {File} file - 文件对象
   * @returns {Blob[]} - 分片数组
   */
  createChunks(file) {
    const chunks = [];
    let start = 0;
    while (start < file.size) {
      chunks.push(file.slice(start, start + this.chunkSize));
      start += this.chunkSize;
    }
    return chunks;
  }

  /**
   * 处理上传队列，控制并发数
   */
  processQueue() {
    while (this.activeCount < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      this.activeCount++;
      task().finally(() => {
        this.activeCount--;
        this.processQueue();
      });
    }

    if (this.activeCount === 0 && this.queue.length === 0) {
      // 所有分片上传完毕，触发回调
      if (this.onAllChunksUploaded) {
        this.onAllChunksUploaded();
      }
      // 请求合并
      this.mergeRequest();
    }
  }

  /**
   * 上传单个分片
   * @param {Blob} chunk - 分片数据
   * @param {number} index - 分片索引
   * @param {string} domain - 目标域名
   */
  async uploadChunk(chunk, index, domain) {
    const formData = new FormData();
    // 重要：后端需要在文件之前接收 fileHash 和 index
    formData.append('fileHash', this.fileHash);
    formData.append('index', index);
    formData.append('file', chunk);

    console.log(`正在上传分片 ${index} 到 ${domain}`);

    try {
      await axios.post(`${domain}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true 
      });
      
      this.uploadedSize += chunk.size;
      if (this.onProgress) {
        this.onProgress(this.uploadedSize / this.totalSize);
      }
    } catch (error) {
      console.error(`上传分片 ${index} 到 ${domain} 失败:`, error);
      // 本演示仅打印错误。在生产环境中需要重试逻辑。
      // 可以在此处添加重新入队逻辑。
    }
  }

  /**
   * 发送合并请求
   */
  async mergeRequest() {
      // 选择一个域名发送合并请求（例如第一个）
      const domain = this.domainList[0];
      try {
          console.log('正在请求合并...');
          const response = await axios.post(`${domain}/merge`, {
              fileHash: this.fileHash,
              filename: this.fileName
          }, {
              withCredentials: true
          });
          console.log('合并完成:', response.data);
          if (this.onComplete) {
              this.onComplete(response.data);
          }
      } catch (error) {
          console.error('合并失败:', error);
      }
  }
}

export default UploadManager;
