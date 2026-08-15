import { type NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

import { isSafeBlobPathname } from "@/lib/blob-pathname";
import { logger } from "@/lib/logger";

// Serve imagens armazenadas na Blob store privada.
// A rota é PÚBLICA de propósito: a vitrine em `/` precisa exibir fotos
// sem autenticação. Os blobs em si continuam privados; só este proxy
// os entrega, após validar o pathname.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.searchParams.get("pathname");

  if (!isSafeBlobPathname(pathname)) {
    return NextResponse.json(
      { error: "Parâmetro 'pathname' inválido." },
      { status: 400 }
    );
  }

  try {
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    });

    if (!result) {
      return new NextResponse("Imagem não encontrada.", { status: 404 });
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "public, max-age=0, must-revalidate",
        },
      });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        ETag: result.blob.etag,
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    logger.error("file.proxy_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Não foi possível carregar a imagem." },
      { status: 500 }
    );
  }
}
