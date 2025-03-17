import { NextResponse } from "next/server";
import AWS from "aws-sdk";

// Blob に name と type プロパティを追加したインターフェースを定義
interface FormFile extends Blob {
    readonly name: string;
    readonly type: string;
}

/**
 * 画像をアップロードするAPI
 * localstackに画像をアップロードする
 * ルートページで使用される
 *
 * localで実行する場合、以下のコマンドでバケットを作成する
 * awslocal s3 mb s3://ml-test-image-bucket で作成
 * awslocal s3 ls s3://ml-test-image-bucket でファイルの存在確認
 */
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        // file が存在し、かつ Blob かどうか、また name プロパティが文字列であるかをチェック
        if (!file || !(file instanceof Blob) || typeof (file as { name?: unknown }).name !== "string") {
            return NextResponse.json(
                { error: "ファイルが取得できませんでした" },
                { status: 400 }
            );
        }

        // file を FormFile 型として扱う
        const fileItem = file as FormFile;
        // ファイル名を取得（存在しなければ "uploaded-file" を使用）
        const originalFilename = fileItem.name || "uploaded-file";

        // Blob から ArrayBuffer を取得して Buffer を生成
        const arrayBuffer = await fileItem.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // S3 の設定（環境変数 NEXT_PUBLIC_S3_* を利用）
        const s3 = new AWS.S3({
            endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT,
            s3ForcePathStyle: true,
            accessKeyId: "test",
            secretAccessKey: "test",
            region: process.env.NEXT_PUBLIC_S3_REGION || "ap-northeast-1",
        });
        const bucket = process.env.NEXT_PUBLIC_S3_IMAGE_BUCKET || "ml-test-image-bucket";

        const params = {
            Bucket: bucket,
            Key: originalFilename,
            Body: buffer,
            ContentType: fileItem.type, // FormFile 型ならここで any キャストは不要
        };

        const uploadResult = await s3.upload(params).promise();
        return NextResponse.json({ uploadResult });
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}