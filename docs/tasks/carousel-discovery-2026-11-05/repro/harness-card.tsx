import React from 'react';
import ResponsiveProductImage from '@/components/ui/shared/ResponsiveProductImage';
// Only the observer/API fallback harness uses this thin card. Full production
// GoodCard links, actions, geometry and failures are tested on the Next app.
export default function Card({id,img,name,loadImage}:any){return <article><a href={'/ru/product/'+id}>{name}<div className="relative flex aspect-27/37 w-full items-center justify-center overflow-hidden"><ResponsiveProductImage src={img} alt={name} loadImage={loadImage} width={270} height={370} className="h-full w-auto object-contain"/></div></a></article>;}
