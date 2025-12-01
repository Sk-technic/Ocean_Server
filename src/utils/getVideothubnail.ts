

export const getCloudinaryThumbnailFromUrl = (videoUrl: string, time: number = 1): string => {
  try {

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME

    const parts = videoUrl.split("/"); 

    const version = parts[6]; // v1763398307
    const folder = parts[7];  // media
    const file = parts[8];    // kpiawlwmjc3zaeupsjjs.mp4

    const publicId = file.replace(/\.mp4$/i, "");

    return `https://res.cloudinary.com/${cloudName}/video/upload/so_${time}/${version}/${folder}/${publicId}.jpg`;

  } catch (err) {
    console.error("Invalid Cloudinary URL:", err);
    return "";
  }
};
