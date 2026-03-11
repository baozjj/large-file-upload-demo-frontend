# Explanations & Constraints

## 1. Why Vite HTTPS Configuration is Required for HTTP/2

To enable the frontend to make HTTP/2 requests to the backend, the following conditions must be met:

1.  **Browser Support for HTTP/2**: All major browsers (Chrome, Firefox, Safari, Edge) implement HTTP/2 only over TLS (h2). They do not support cleartext HTTP/2 (h2c). Therefore, the backend server must be running on HTTPS.
2.  **Secure Context**: While `localhost` is considered a secure context by browsers, using custom local domains like `u1.local.com` or `u2.local.com` requires a valid TLS certificate to be treated as secure. Without HTTPS, browsers might downgrade the connection to HTTP/1.1 or block requests due to mixed content policies if the page was loaded over HTTPS but API was HTTP (though less likely here since we control both).
3.  **Consistency**: Configuring Vite to serve the frontend over HTTPS ensures a consistent secure environment, avoiding mixed content warnings and accurately simulating a production environment where both frontend and backend are served securely.

By using `mkcert`, we generate locally trusted certificates, allowing both the Vite dev server and the backend to run over HTTPS, thus enabling the browser to negotiate HTTP/2 connections.

## 2. Handling Cross-Origin Requests (CORS) with Credentials

When making cross-origin requests (e.g., from `https://localhost:5173` to `https://u1.local.com`), browsers enforce strict security policies regarding cookies and authentication headers. To ensure they are sent correctly:

### Frontend (Client-side)

You must explicitly tell the browser to include credentials in the request.

*   **Axios**:
    ```javascript
    axios.post('https://u1.local.com/upload', data, {
      withCredentials: true // Mandatory for sending cookies
    });
    ```

*   **Fetch API**:
    ```javascript
    fetch('https://u1.local.com/upload', {
      method: 'POST',
      body: data,
      credentials: 'include' // Mandatory for sending cookies
    });
    ```

### Backend (Server-side)

The server must respond with specific CORS headers to allow the request with credentials.

1.  **`Access-Control-Allow-Origin`**: Must be the **exact origin** of the frontend (e.g., `https://localhost:5173`). It **cannot** be `*`.
2.  **`Access-Control-Allow-Credentials`**: Must be set to `true`.
3.  **`Access-Control-Allow-Headers`**: Must include any custom headers sent by the frontend (e.g., `Content-Type`, `Authorization`).

**Example Nginx Configuration**:
```nginx
add_header 'Access-Control-Allow-Origin' 'https://localhost:5173' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
```

**Example Node.js (Express) Configuration**:
```javascript
app.use(cors({
  origin: 'https://localhost:5173', // Must match frontend origin
  credentials: true
}));
```
