'use server'

import { NextResponse, NextRequest } from "next/server";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary"
import { promises as fs } from 'fs';
import path from 'path';

// LOCAL_IMAGE_STORAGE is intended only for local dev. On serverless (e.g. Vercel) the filesystem is ephemeral.
const requestedLocal = process.env.LOCAL_IMAGE_STORAGE === 'true';
const runningOnVercel = !!process.env.VERCEL;
// If user requested local but we're on a serverless platform, force fallback to Cloudinary.
const USE_LOCAL = requestedLocal && !runningOnVercel;

// Configure Cloudinary if we will use it.
if (!USE_LOCAL) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
        console.error('[upload-hotel-images] Missing Cloudinary environment variables in production.');
    } else {
        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true
        });
    }
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
            const uploadedImageUrls: string[] = [];
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
            const apiSecret = process.env.CLOUDINARY_API_SECRET;
            if (!cloudName || !apiKey || !apiSecret) {
                return NextResponse.json({ error: 'Cloudinary not configured on server (missing env vars)' }, { status: 500 });
            }
            for (const buffer of buffers) {
                try {
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
                    if (result?.secure_url) {
                        uploadedImageUrls.push(result.secure_url);
                    }
                } catch (e) {
                    console.error('[upload-hotel-images] Single image upload failed:', e);
                }
            }
            return NextResponse.json(uploadedImageUrls.filter(Boolean), { status: 200 });
        }
    } catch (err: any) {
        console.error('Upload error:', err);
        return NextResponse.json({ error: 'Upload failed', details: err?.message }, { status: 500 });
    }
}