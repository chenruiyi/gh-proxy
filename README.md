This repository provides a Cloudflare Workers script (`worker.js`) to accelerate the download of GitHub raw files by leveraging Cloudflare's edge network. By proxying GitHub file URLs through your custom domain, you can achieve faster download speeds and better reliability.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup and Deployment](#setup-and-deployment)
- [Usage](#usage)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- **Speed Up Downloads:** Utilize Cloudflare's global edge network to accelerate GitHub file downloads.
- **Wide Compatibility:** Supports various GitHub resources, including Releases, Raw files, and Archives.
- **Caching:** Implements Cloudflare caching to reduce latency for repeated downloads.
- **Flexible Routing:** Easily proxy any GitHub file URL through your custom domain.
- **Secure:** Optionally restrict proxying to specific hosts (e.g., only GitHub).

## Prerequisites

- **Cloudflare Account:** Ensure you have a Cloudflare account. [Sign up here](https://dash.cloudflare.com/sign-up) if you don't have one.
- **Custom Domain:** You need a domain managed by Cloudflare (e.g., `gh.mydomain.com`).
- **Cloudflare Workers Access:** Access to Cloudflare Workers (available on all plans, including the free tier).

## Setup and Deployment

1. **Create a New Worker**
   - Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
   - Navigate to **Workers** in the sidebar.
   - Click on **Create a Worker**.

2. **Name and Configure the Worker**
   - Give your Worker a recognizable name, such as `GitHub-Accelerator`.
   - In the code editor, delete any existing code.

3. **Add `worker.js` Code**
   - Paste the contents of `worker.js` from this repository into the editor.

4. **Deploy the Worker**
   - Click on **Save and Deploy** to activate the Worker.

5. **Set Up Routes**
   - Go to the **Settings** tab within the Workers dashboard.
   - Under **Domains & Routes**, add a new route:
     ```
     gh.mydomain.com/*
     ```
     or add a custom domain:
     ```
     gh.mydomain.com
     ```

Upon successful deployment, your Worker will be accessible at `https://gh.mydomain.com/*`.

## Usage

To accelerate a GitHub file download, modify the GitHub raw URL to pass through your custom domain.

### Original GitHub URL

```
https://github.com/username/repository/releases/download/version/file.tar.gz
```

### Accelerated URL via Cloudflare Worker

```
https://gh.mydomain.com/https://github.com/username/repository/releases/download/version/file.tar.gz
```

**Example:**

- **Original:** `https://github.com/octocat/Hello-World/releases/download/v1.0.0/hello-world.tar.gz`
- **Accelerated:** `https://gh.mydomain.com/https://github.com/octocat/Hello-World/releases/download/v1.0.0/hello-world.tar.gz`

Accessing the accelerated URL will route the request through Cloudflare's edge network, potentially speeding up the download.

## Customization

### Restricting to Specific Hosts

To enhance security, you can restrict the proxy to only allow specific hosts (e.g., GitHub). Modify the `worker.js` as follows:

```javascript
const allowedHosts = ['github.com', 'raw.githubusercontent.com'];

if (!allowedHosts.includes(realTarget.host)) {
  return new Response('Only GitHub URLs are allowed', { status: 403 });
}
```

### Adjusting Cache Settings

Customize caching behavior by modifying the `cf` options in the `fetch` request:

```javascript
fetchResponse = await fetch(realTarget, {
  ...newRequestInit,
  cf: {
    cacheEverything: true,
    cacheTtl: 3600, // Cache for 1 hour
    // Additional cache settings can be added here
  }
});
```

### Handling CORS

If you need to handle Cross-Origin Resource Sharing (CORS), adjust the response headers:

```javascript
const responseHeaders = new Headers(fetchResponse.headers);
responseHeaders.set('Access-Control-Allow-Origin', '*');
responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');

return new Response(fetchResponse.body, {
  status: fetchResponse.status,
  statusText: fetchResponse.statusText,
  headers: responseHeaders
});
```

## Troubleshooting

- **Invalid Routes:** Ensure that your Cloudflare Worker is correctly bound to the desired route (`gh.mydomain.com/*`).
- **Caching Issues:** If updates to files aren't reflecting, consider adjusting the `cacheTtl` or clearing the cache via Cloudflare Dashboard.
- **Access Denied:** Verify that the Worker script allows the intended hosts and that your custom domain is correctly configured.

## License

This project is licensed under the [MIT License](LICENSE).
