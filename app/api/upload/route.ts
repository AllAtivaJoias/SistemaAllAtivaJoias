import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { requireAdmin, AuthError } from "@/lib/auth-guard";
import { logger } from "@/lib/logger";
import { imageExtensionMatchesMime, sniffImageMime } from "@/lib/image-sniff";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Limite seguro para Vercel Serverless (body máx. ~4.5 MB).
const MAX_SIZE_IN_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin();
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 401;
    return NextResponse.json({ error: "Não autorizado." }, { status });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Armazenamento não configurado. Adicione BLOB_READ_WRITE_TOKEN nas variáveis da Vercel.",
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Nenhum arquivo enviado." },
      { status: 400 }
    );
  }

  if (file.type && !ALLOWED_CONTENT_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Formato inválido. Use JPG, PNG, WEBP ou GIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_IN_BYTES) {
    return NextResponse.json(
      { error: "A imagem deve ter no máximo 4 MB." },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImageMime(bytes);
  if (!sniffed || !ALLOWED_CONTENT_TYPES.has(sniffed)) {
    return NextResponse.json(
      { error: "O conteúdo do arquivo não é uma imagem permitida." },
      { status: 400 }
    );
  }
  if (file.type && file.type !== sniffed) {
    return NextResponse.json(
      { error: "O tipo declarado não corresponde ao conteúdo do arquivo." },
      { status: 400 }
    );
  }
  if (!imageExtensionMatchesMime(file.name, sniffed)) {
    return NextResponse.json(
      { error: "A extensão do arquivo não corresponde ao conteúdo." },
      { status: 400 }
    );
  }

  try {
    // A Blob store está configurada como privada, então enviamos com
    // access "private". O arquivo não fica acessível pela URL direta;
    // por isso servimos as imagens através da rota /api/file.
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "image";
    const blob = await put(`products/${safeName}`, file, {
      access: "private",
      addRandomSuffix: true,
    });

    // Guardamos uma URL relativa que aponta para a rota de entrega.
    // Isso funciona tanto no admin quanto no catálogo público.
    const url = `/api/file?pathname=${encodeURIComponent(blob.pathname)}`;

    return NextResponse.json({ url });
  } catch (error) {
    logger.error("upload.failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Falha no upload. Tente novamente." },
      { status: 500 }
    );
  }
}
