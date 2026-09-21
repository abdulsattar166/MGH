import { useCallback, useEffect, useState } from "react";
import { fetchBlocks, type Block } from "@/lib/buildingsDb";

export function useBlocks(buildingId?: number) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setBlocks(await fetchBlocks(buildingId));
    } catch (e) {
      setError((e as Error).message || "Could not load blocks.");
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    load();
  }, [load]);

  return { blocks, loading, error, reload: load };
}