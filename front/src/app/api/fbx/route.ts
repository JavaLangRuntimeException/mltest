import { NextResponse } from "next/server";
import AWS from "aws-sdk";

/**
 * FBX ファイルを取得する
 * localstackにアップロードされたFBXファイルを取得する
 * /analyze のページで使用される
 */
export async function GET(request: Request) {
    try {
        // URL パラメータから product（FBX ファイル名）を取得
        const { searchParams } = new URL(request.url);
        const product = searchParams.get("product");
        if (!product) {
            return NextResponse.json({ error: "Product parameter is required" }, { status: 400 });
        }

        // AWS S3 の設定（環境変数 NEXT_PUBLIC_S3_* を利用）
        const s3 = new AWS.S3({
            endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT,
            s3ForcePathStyle: true,
            accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY || "test",
            secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_KEY || "test",
            region: process.env.NEXT_PUBLIC_S3_REGION || "ap-northeast-1",
        });
        // FBX ファイルは別のバケットへ配置している前提（例: ml-test-product-bucket）
        const bucket = process.env.NEXT_PUBLIC_S3_PRODUCT_BUCKET || "ml-test-product-bucket";

        const params = {
            Bucket: bucket,
            Key: product,
        };

        const result = await s3.getObject(params).promise();
        if (!result.Body) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // FBX はバイナリデータなので body と Content-Type を設定して返す
        const headers = new Headers();
        headers.set("Content-Type", "application/octet-stream");
        headers.set("Content-Disposition", `inline; filename="${product}"`);
        return new NextResponse(result.Body as Buffer, { headers });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}