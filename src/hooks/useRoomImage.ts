import { useCallback, useEffect, useState } from "react";
import { getRoomImage, setRoomImage, subscribeRoomImages } from "@/lib/roomImages";

export function useRoomImage(key: string) {
  const [image, setImage] = useState(() => getRoomImage(key));

  useEffect(
    () => subscribeRoomImages(() => setImage(getRoomImage(key))),
    [key],
  );

  const update = useCallback(
    (dataUrl: string) => setRoomImage(key, dataUrl),
    [key],
  );

  return { image, update };
}