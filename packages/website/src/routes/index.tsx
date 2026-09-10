import type { MaterialXValidationIssue } from 'mtlx-core';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { MaterialViewer, type MaterialSource } from '../components/MaterialViewer';
import { ValidationPanel } from '../components/ValidationPanel';
import { extractMaterialXText } from '../lib/materialx-zip';
import { PRESET_MATERIALS, presetFileName, presetFolderUrl } from '../lib/presets';
import { validateMaterialXText } from '../lib/validate';

export const Route = createFileRoute('/')({
  ssr: false,
  component: HomePage,
});

function HomePage() {
  const [source, setSource] = useState<MaterialSource | null>(null);
  const [issues, setIssues] = useState<MaterialXValidationIssue[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const loadFromFile = async (file: File) => {
    setFileError(null);
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.mtlx') && !lowerName.endsWith('.mtlz') && !lowerName.endsWith('.mtlx.zip')) {
      setFileError('Unsupported file type — drop a .mtlx, .mtlz, or .mtlx.zip file.');
      return;
    }
    try {
      const data = await file.arrayBuffer();
      setSource({ kind: 'buffer', data, name: file.name });
      const text = lowerName.endsWith('.mtlx') ? new TextDecoder().decode(data) : extractMaterialXText(data);
      setIssues(validateMaterialXText(text));
    } catch (error) {
      setFileError(error instanceof Error ? error.message : String(error));
    }
  };

  const loadPreset = async (preset: (typeof PRESET_MATERIALS)[number]) => {
    setFileError(null);
    const folderUrl = presetFolderUrl(preset);
    const fileName = presetFileName(preset);
    setSource({ kind: 'url', folderUrl, fileName });
    try {
      const text = await fetch(`${folderUrl}${fileName}`).then((response) => response.text());
      setIssues(validateMaterialXText(text));
    } catch (error) {
      setFileError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">mtlx viewer</h1>
        <p className="text-white/60">Drag and drop a MaterialX file, or pick a preset below.</p>
      </header>

      <div
        className="rounded-lg border border-dashed border-white/20 p-8 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file) void loadFromFile(file);
        }}
      >
        <p>Drop a .mtlx, .mtlz, or .mtlx.zip file here</p>
        <input
          type="file"
          accept=".mtlx,.mtlz,.zip"
          className="mt-2"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void loadFromFile(file);
          }}
        />
        {fileError ? <p className="mt-2 text-red-400">{fileError}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_MATERIALS.map((preset) => (
          <button
            key={`${preset.category}/${preset.name}`}
            type="button"
            className="rounded border border-white/20 px-3 py-1 text-sm hover:bg-white/10"
            onClick={() => void loadPreset(preset)}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <MaterialViewer source={source} onError={setLoadError} />
        <ValidationPanel issues={issues} loadError={loadError} />
      </div>
    </main>
  );
}
