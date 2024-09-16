'use server'

import { NextResponse, NextRequest } from "next/server";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary"

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
})

export async function POST(req: NextRequest) {
    const body = await req.json()

    const buffers = body.buffers.map((arr: number[]) => new Uint8Array(arr));

    const uploadedImageUrls: (string | undefined)[] = []

    for (const buffer of buffers) {
        const result: UploadApiResponse | undefined = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                tags: ['nextjs-rutaviajera-hotels']
            }, function (error, result: UploadApiResponse | undefined) {
                if (error) {
                    reject(error)
                    return
                }
                resolve(result)
            }).end(buffer)
        })

        uploadedImageUrls.push(result?.secure_url)
    }

    return NextResponse.json(uploadedImageUrls)
}