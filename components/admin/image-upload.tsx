"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, RefreshCw, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface ImageUploadProps {
  /** Nome do input escondido que carrega a URL para o formulário. */
  name: string;
  /** URL já existente (ao editar um produto). */
  defaultValue?: string;
  /** Notifica o formulário controlado (RHF) quando a URL muda. */
  onChange?: (url: string) => void;
}

const MAX_SIZE_IN_BYTES = 4 * 1024 * 1024; // 4 MB (limite seguro na Vercel)
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatLabel(type: string): string {
  if (type === "image/jpeg") return "JPEG";
  if (type === "image/png") return "PNG";
  if (type === "image/webp") return "WEBP";
  if (type === "image/gif") return "GIF";
  return type || "Imagem";
}

export function ImageUpload({
  name,
  defaultValue = "",
  onChange,
}: ImageUploadProps) {
  const [url, setUrl] = useState(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{
    type: string;
    size: number;
  } | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  function updateUrl(next: string) {
    setUrl(next);
    onChange?.(next);
    if (!next) {
      setFileMeta(null);
      setDimensions(null);
    }
  }

  async function uploadFile(file: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Formato inválido. Use JPG, PNG, WEBP ou GIF.");
      return;
    }
    if (file.size > MAX_SIZE_IN_BYTES) {
      setError("A imagem deve ter no máximo 4 MB.");
      return;
    }

    setFileMeta({ type: file.type, size: file.size });
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Falha no upload. Tente novamente.");
      }

      if (!data.url) {
        throw new Error("Resposta inválida do servidor.");
      }

      setUrl(data.url);
      onChange?.(data.url);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Falha no upload. Tente novamente.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void uploadFile(file);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  const metaParts = [
    fileMeta ? formatLabel(fileMeta.type) : url ? "Imagem atual" : null,
    dimensions ? `${dimensions.w}×${dimensions.h}px` : null,
    fileMeta ? formatBytes(fileMeta.size) : null,
  ].filter(Boolean);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <Image
            src={url}
            alt="Prévia da imagem"
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover"
            onLoad={(event) => {
              const img = event.currentTarget;
              if (img.naturalWidth && img.naturalHeight) {
                setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
              }
            }}
          />

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/40">
              <Loader2 className="h-6 w-6 animate-spin text-background" />
            </div>
          )}

          <div className="absolute right-2 top-2 flex gap-1">
            <button
              type="button"
              onClick={openFilePicker}
              disabled={isUploading}
              aria-label="Substituir imagem"
              title="Substituir"
              className="rounded-md bg-card/90 p-1.5 text-foreground shadow-sm transition-colors hover:bg-card"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => updateUrl("")}
              disabled={isUploading}
              aria-label="Remover imagem"
              title="Remover"
              className="rounded-md bg-card/90 p-1.5 text-destructive shadow-sm transition-colors hover:bg-card"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") openFilePicker();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors",
            isDragging
              ? "border-primary bg-accent"
              : "border-border bg-muted hover:border-primary/50 hover:bg-accent/50"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Enviando imagem...</p>
            </>
          ) : (
            <>
              <ImagePlus className="h-7 w-7 text-primary" />
              <p className="text-sm font-medium text-foreground">
                Clique para selecionar ou arraste uma imagem
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WEBP ou GIF · até 4 MB
              </p>
            </>
          )}
        </div>
      )}

      {metaParts.length > 0 && (
        <p className="text-xs text-muted-foreground">{metaParts.join(" · ")}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
