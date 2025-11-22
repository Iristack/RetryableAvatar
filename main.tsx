import { Avatar } from "antd";
import { useEffect, useRef, useState, memo } from "react";

interface RetryableAvatarProps {
  faceId: string;
  size?: number;
  nickName: string;
}

export const RetryableAvatar = memo(({ faceId, size = 75, nickName }: RetryableAvatarProps) => {
  const currentFaceIdRef = useRef<string | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [loadingFailed, setLoadingFailed] = useState(false);

  const retryCountRef = useRef(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const maxRetry = 3;
  const retryDelay = 2000;

  const fallbackText = nickName ? nickName.charAt(0).toUpperCase() : 'U';

  const loadImage = (baseURL: string) => {
    if (currentFaceIdRef.current !== faceId) return;

    if (imgRef.current) {
      imgRef.current.onload = null;
      imgRef.current.onerror = null;
    }

    // 加ts可以避免cache
    const urlWithTimestamp = `${baseURL}`;
    // const urlWithTimestamp = `${baseURL}?t=${Date.now()}`;
    const img = new Image();
    imgRef.current = img;

    img.onload = () => {
      if (currentFaceIdRef.current !== faceId) return;
      setFinalImageUrl(urlWithTimestamp);
      setLoadingFailed(false);
    };

    img.onerror = () => {
      if (currentFaceIdRef.current !== faceId) return;

      const currentRetry = retryCountRef.current;
      if (currentRetry < maxRetry) {
        retryCountRef.current += 1;
        setTimeout(() => {
          loadImage(baseURL);
        }, retryDelay);
      } else {
        setLoadingFailed(true);
      }
    };

    img.src = urlWithTimestamp;
  };

  useEffect(() => {
    if (!faceId || faceId === currentFaceIdRef.current) {
      return;
    }

    currentFaceIdRef.current = faceId;

    setFinalImageUrl(null);
    setLoadingFailed(false);
    retryCountRef.current = 0;

    // picsum, 实际使用的时候替换自己的url
    const baseURL = `https://picsum.photos/seed/${faceId}/100`;
    loadImage(baseURL);

    return () => {
      currentFaceIdRef.current = null;
      if (imgRef.current) {
        imgRef.current.onload = null;
        imgRef.current.onerror = null;
        imgRef.current = null;
      }
    };
  }, [faceId]);

  if (finalImageUrl && !loadingFailed) {
    return <Avatar src={finalImageUrl} size={size} alt={nickName} />;
  }

  return <Avatar size={size} children={fallbackText} />;
});
