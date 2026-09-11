import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { loadMaterial, MaterialLoadError, type LoadedMaterial, type MaterialLoadProgress } from '../lib/material-load';
import { resolveMaterialParam } from '../lib/presets';

interface LoadRequest {
  input: File | string;
  controller: AbortController;
}

function validationLog(result: LoadedMaterial): string[] {
  const { issues } = result.analysis;
  const errors = issues.filter((issue) => issue.level === 'error').length;
  return [
    `Parsed ${result.fileMeta.name}.`,
    issues.length
      ? `Validation: ${errors} error(s), ${issues.length - errors} warning(s).`
      : 'Validation: no issues found.',
    ...issues.map((issue) => `${issue.level === 'error' ? 'ERROR' : 'WARNING'}: ${issue.location}: ${issue.message}`),
  ];
}

/** Mutation state owns the material and diagnostics; only progress and renderer logs are local state. */
export function useMaterialLoad() {
  const activeController = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<MaterialLoadProgress | null>(null);
  const [renderLog, setRenderLog] = useState<string[]>([]);
  const mutation = useMutation<LoadedMaterial, MaterialLoadError, LoadRequest>({
    mutationKey: ['load-material'],
    gcTime: 0, // Do not retain superseded material buffers in the mutation cache.
    retry: false,
    networkMode: 'always', // Local files must still load when the browser is offline.
    mutationFn: ({ input, controller }) => {
      controller.signal.throwIfAborted();
      if (typeof input !== 'string') return loadMaterial(input, controller.signal, setProgress);
      const resolved = resolveMaterialParam(input);
      if (!resolved) throw new MaterialLoadError(`Unknown material "${input}"`);
      const url = new URL(resolved.folderUrl + resolved.fileName, window.location.origin).href;
      return loadMaterial({ url, name: resolved.fileName }, controller.signal, setProgress);
    },
  });
  const { mutate, reset } = mutation;
  const clear = useCallback(() => {
    activeController.current?.abort();
    reset();
    setProgress(null);
    setRenderLog([]);
  }, [reset]);
  const load = useCallback(
    (input: File | string) => {
      activeController.current?.abort();
      const controller = new AbortController();
      activeController.current = controller;
      setProgress(null);
      setRenderLog([]);
      mutate({ input, controller });
    },
    [mutate],
  );
  useEffect(() => () => activeController.current?.abort(), []);
  const appendLog = useCallback((message: string) => setRenderLog((lines) => [...lines, message]), []);
  const input = mutation.variables?.input;
  const logLines = [
    ...(input ? [`Loading ${typeof input === 'string' ? input : input.name}...`] : []),
    ...(mutation.data ? validationLog(mutation.data) : []),
    ...(mutation.error ? [`ERROR: ${mutation.error.message}`] : []),
    ...renderLog,
  ];
  return {
    load,
    clear,
    appendLog,
    logLines,
    source: mutation.data?.source ?? null,
    fileMeta: mutation.data?.fileMeta,
    analysis: mutation.data?.analysis ?? mutation.error?.analysis,
    fileError: mutation.error?.message ?? null,
    loadProgress: mutation.isPending ? progress : null,
    isPending: mutation.isPending,
  };
}
