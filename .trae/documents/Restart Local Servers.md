I will restart the backend and frontend servers to ensure all recent changes (PDF service fixes, subscription types, and frontend logo updates) are applied correctly.

### **Steps:**
1.  **Stop Existing Servers:** Stop the processes running in Terminal 4 (backend) and Terminal 5 (frontend).
2.  **Rebuild Backend:** Run `npm run build` to confirm that the fixes in `pdf.service.ts` and `subscriptions.service.ts` compile without errors.
3.  **Start Backend:** Run `npm run start` to launch the backend server.
4.  **Start Frontend:** Run `npm run dev --prefix dashboard` to launch the frontend web application.

This ensures a clean slate with the latest code.