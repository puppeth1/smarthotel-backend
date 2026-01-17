I will implement the Next.js API proxy to handle the subscription request server-side, bypassing browser CORS issues when communicating with Cloud Run.

### **Steps:**
1.  **Create API Route:** Create `dashboard/app/api/subscriptions/create/route.ts` with the provided code. This route will:
    *   Receive the request from the frontend.
    *   Forward it to the Cloud Run backend (`https://smarthotel-back-984031420056.asia-south1.run.app/subscriptions/create`) server-side.
    *   Return the backend's response to the frontend.
2.  **Update Frontend:** Modify `dashboard/app/subscription/page.tsx` to fetch from the new local API route (`/api/subscriptions/create`) instead of the external URL.
3.  **Restart Frontend:** Restart the development server (`npm run dev`) to register the new API route and apply changes.

This approach ensures secure, CORS-free communication between your Next.js app and the Cloud Run backend.