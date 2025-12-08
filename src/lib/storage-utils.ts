import { supabase } from "@/integrations/supabase/client";

/**
 * Get a signed URL for a file in a private Supabase storage bucket
 * @param bucketName - The name of the storage bucket
 * @param filePath - The path to the file within the bucket
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns The signed URL or null if an error occurs
 */
export const getSignedUrl = async (
  bucketName: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error in getSignedUrl:", error);
    return null;
  }
};

/**
 * Extract the file path from a full Supabase storage URL
 * @param url - The full URL containing the file path
 * @param bucketName - The name of the storage bucket
 * @returns The extracted file path or null if extraction fails
 */
export const extractFilePathFromUrl = (
  url: string,
  bucketName: string
): string | null => {
  try {
    // Handle public URLs: .../storage/v1/object/public/bucketname/path
    const publicPattern = `/storage/v1/object/public/${bucketName}/`;
    if (url.includes(publicPattern)) {
      const parts = url.split(publicPattern);
      if (parts.length >= 2) {
        return decodeURIComponent(parts[1]);
      }
    }

    // Handle signed URLs: .../storage/v1/object/sign/bucketname/path
    const signedPattern = `/storage/v1/object/sign/${bucketName}/`;
    if (url.includes(signedPattern)) {
      const parts = url.split(signedPattern);
      if (parts.length >= 2) {
        // Remove query parameters
        return decodeURIComponent(parts[1].split("?")[0]);
      }
    }

    // Try to extract from authenticated URL pattern
    const authPattern = `/storage/v1/object/authenticated/${bucketName}/`;
    if (url.includes(authPattern)) {
      const parts = url.split(authPattern);
      if (parts.length >= 2) {
        return decodeURIComponent(parts[1]);
      }
    }

    // If it's just a file path already, return as-is
    if (!url.includes("://") && !url.startsWith("/storage/")) {
      return url;
    }

    console.warn("Could not extract file path from URL:", url);
    return null;
  } catch (error) {
    console.error("Error extracting file path:", error);
    return null;
  }
};

/**
 * Open a document from Supabase storage in a new tab
 * @param documentUrl - The stored document URL
 * @param bucketName - The name of the storage bucket (default: 'cvs')
 */
export const openDocument = async (
  documentUrl: string,
  bucketName: string = "cvs"
): Promise<boolean> => {
  try {
    const filePath = extractFilePathFromUrl(documentUrl, bucketName);
    
    if (!filePath) {
      console.error("Could not extract file path from URL:", documentUrl);
      return false;
    }

    const signedUrl = await getSignedUrl(bucketName, filePath);
    
    if (!signedUrl) {
      console.error("Could not generate signed URL for:", filePath);
      return false;
    }

    window.open(signedUrl, "_blank");
    return true;
  } catch (error) {
    console.error("Error opening document:", error);
    return false;
  }
};
