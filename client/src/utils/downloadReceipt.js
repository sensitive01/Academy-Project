import api from "../services/api";
import toast from "react-hot-toast";

/**
 * Utility to download a receipt/invoice PDF from the server.
 * @param {string} endpoint - The API endpoint to call (e.g., "/payment/invoice/123")
 * @param {string} defaultFilename - Fallback filename
 */
export const downloadReceipt = async (endpoint, defaultFilename = "Receipt.pdf") => {
  const toastId = toast.loading("Preparing your document...");
  try {
    const response = await api.get(endpoint, {
      responseType: "blob", // Important for downloading files
    });

    // Extract filename from Content-Disposition header if available
    let filename = defaultFilename;
    const disposition = response.headers["content-disposition"];
    if (disposition && disposition.indexOf("filename=") !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, "");
      }
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Document downloaded successfully!", { id: toastId });
  } catch (error) {
    console.error("Error downloading document:", error);
    toast.error("Failed to download document", { id: toastId });
  }
};
