I have identified the issue. The frontend is configured to connect to a production Cloud Run URL (`https://smarthotel-back-984031420056.asia-south1.run.app`) via `dashboard/.env.local`, but you are running the backend locally on `http://localhost:8080`.

Since you are in a development environment (`npm run dev`), the frontend should be talking to your local backend, not the production one (which might be down, unreachable, or have different code).

### **Plan:**
1.  **Update `dashboard/.env.local`:** Change `NEXT_PUBLIC_API_URL` to `http://localhost:8080`. This will point the frontend to your currently running local backend.
2.  **Restart Frontend:** The frontend needs to be restarted for the environment variable change to take effect.

This will fix the "Failed to fetch" error by ensuring the frontend connects to the running local server.

**Note:** The backend code (controllers) and Razorpay integration look correct. The mismatch in the API URL is the root cause.