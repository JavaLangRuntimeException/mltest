import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // クライアントから送信された JSON ボディをパース
        // 期待するフィールド: file_name, content_type, image_data
        const body = await request.json();
        const { file_name, content_type, image_data } = body;
        if (!file_name || !content_type || !image_data) {
            return NextResponse.json(
                { error: "必要なパラメータが不足しています" },
                { status: 400 }
            );
        }

        // 環境変数またはデフォルトのバックエンド URL を取得
        const backendURL =
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

        // 受け取った情報をそのままバックエンド（Go API）の /analyze エンドポイントに転送
        const response = await fetch(`${backendURL}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_name, content_type, image_data }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            return NextResponse.json(
                { error: errorBody.error || "Unknown error" },
                { status: response.status }
            );
        }

        const result = await response.json();
        return NextResponse.json(result, { status: 200 });
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Unexpected error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}