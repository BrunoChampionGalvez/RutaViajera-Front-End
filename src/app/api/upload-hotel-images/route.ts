'use server'

import { NextResponse, NextRequest } from "next/server";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary"
import { promises as fs } from 'fs';
import path from 'path';

const USE_LOCAL = process.env.LOCAL_IMAGE_STORAGE === 'true';

if (!USE_LOCAL) {
    cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const buffers = body.arraysOfBuffers?.map((arr: number[]) => new Uint8Array(arr)) || [];

        if (!Array.isArray(buffers) || buffers.length === 0) {
            return NextResponse.json([], { status: 200 });
        }

        if (USE_LOCAL) {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'hotels');
            await fs.mkdir(uploadDir, { recursive: true });

            const urls: string[] = [];
            let index = 0;
            for (const buffer of buffers) {
                const filename = `hotel_${Date.now()}_${index++}.jpg`;
                const filePath = path.join(uploadDir, filename);
                await fs.writeFile(filePath, buffer);
                urls.push(`/uploads/hotels/${filename}`);
            }
            return NextResponse.json(urls, { status: 200 });
        } else {
            const uploadedImageUrls: (string | undefined)[] = [];
            for (const buffer of buffers) {
                const result: UploadApiResponse | undefined = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream({
                        tags: ['nextjs-rutaviajera-hotels']
                    }, function (error, result: UploadApiResponse | undefined) {
                        if (error) {
                            reject(error);
                            return;
                        }
                        resolve(result);
                    }).end(buffer);
                });
                uploadedImageUrls.push(result?.secure_url);
            }
            return NextResponse.json(uploadedImageUrls, { status: 200 });
        }
    } catch (err: any) {
        console.error('Upload error:', err);
        return NextResponse.json({ error: 'Upload failed', details: err?.message }, { status: 500 });
    }
}