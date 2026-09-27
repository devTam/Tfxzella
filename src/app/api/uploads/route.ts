import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/auth";

export async function POST(req:Request){
  const session=await auth();
  if(!session?.user?.id)return Response.json({error:"Unauthorized"},{status:401});
  const {mimeType,size}=await req.json();
  if(!["image/png","image/jpeg","image/webp"].includes(mimeType)||!Number.isInteger(size)||size<=0||size>5_000_000){
    return Response.json({error:"Only PNG, JPEG, or WebP images up to 5MB are allowed"},{status:400});
  }
  const cloudName=process.env.CLOUDINARY_CLOUD_NAME,apiKey=process.env.CLOUDINARY_API_KEY,apiSecret=process.env.CLOUDINARY_API_SECRET;
  if(!cloudName||!apiKey||!apiSecret)return Response.json({error:"Cloudinary is not configured"},{status:503});
  const timestamp=Math.floor(Date.now()/1000);
  const folder=`tfxzella/users/${session.user.id}`;
  const publicId=randomUUID();
  const uploadParams={timestamp,folder,public_id:publicId,type:"authenticated",overwrite:false};
  const signature=cloudinary.utils.api_sign_request(uploadParams,apiSecret);
  return Response.json({
    uploadUrl:`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    cloudName,
    apiKey,
    signature,
    ...uploadParams,
    objectKey:`${folder}/${publicId}`,
    expiresIn:3600,
  });
}
