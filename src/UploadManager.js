import axios from 'axios';
import SparkMD5 from 'spark-md5';

class UploadManager {
  constructor(domainList, concurrency = 6) {
    this.domainList = domainList;
    this.concurrency = concurrency;
    this.queue = [];
    this.activeCount = 0;
    this.totalSize = 0;
    this.uploadedSize = 0;
    this.onProgress = null;
    this.onComplete = null;
    this.chunkSize = 2 * 1024 * 1024; // 2MB per chunk
    this.fileHash = null;
    this.fileName = null;
  }

  async upload(file) {
    this.totalSize = file.size;
    this.uploadedSize = 0;
    this.fileName = file.name;

    // Calculate hash first
    console.log('Calculating file hash...');
    this.fileHash = await this.calculateHash(file);
    console.log('File Hash:', this.fileHash);

    const chunks = this.createChunks(file);
    
    // Create tasks for each chunk
    const tasks = chunks.map((chunk, index) => {
      const domainIndex = index % this.domainList.length;
      const domain = this.domainList[domainIndex];
      return () => this.uploadChunk(chunk, index, domain);
    });

    // Add tasks to queue
    this.queue.push(...tasks);
    
    // Start processing
    this.processQueue();
  }

  calculateHash(file) {
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer();
      const reader = new FileReader();
      const chunkSize = 2 * 1024 * 1024; // Read in 2MB chunks for hashing
      const chunks = Math.ceil(file.size / chunkSize);
      let currentChunk = 0;

      reader.onload = (e) => {
        spark.append(e.target.result);
        currentChunk++;

        if (currentChunk < chunks) {
          loadNext();
        } else {
          resolve(spark.end());
        }
      };

      reader.onerror = (e) => {
        reject(e);
      };

      function loadNext() {
        const start = currentChunk * chunkSize;
        const end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
        reader.readAsArrayBuffer(file.slice(start, end));
      }

      loadNext();
    });
  }

  createChunks(file) {
    const chunks = [];
    let start = 0;
    while (start < file.size) {
      chunks.push(file.slice(start, start + this.chunkSize));
      start += this.chunkSize;
    }
    return chunks;
  }

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
      // All chunks uploaded, request merge
      this.mergeRequest();
    }
  }

  async uploadChunk(chunk, index, domain) {
    const formData = new FormData();
    // Important: Backend requires fileHash and index BEFORE file
    formData.append('fileHash', this.fileHash);
    formData.append('index', index);
    formData.append('file', chunk);

    console.log(`Uploading chunk ${index} to ${domain}`);

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
      console.error(`Failed to upload chunk ${index} to ${domain}:`, error);
      // For this demo, simply logging error. In production, retry logic is needed.
      // Re-queueing logic would go here.
    }
  }

  async mergeRequest() {
      // Pick a domain to send merge request (e.g., the first one)
      const domain = this.domainList[0];
      try {
          console.log('Requesting merge...');
          const response = await axios.post(`${domain}/merge`, {
              fileHash: this.fileHash,
              filename: this.fileName
          }, {
              withCredentials: true
          });
          console.log('Merge complete:', response.data);
          if (this.onComplete) {
              this.onComplete(response.data);
          }
      } catch (error) {
          console.error('Merge failed:', error);
      }
  }
}

export default UploadManager;
