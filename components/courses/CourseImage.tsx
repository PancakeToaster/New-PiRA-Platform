"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/Dialog";
import { ZoomIn } from "lucide-react";
import { useState } from "react";

interface CourseImageProps {
    src: string;
    alt: string;
}

export default function CourseImage({ src, alt }: CourseImageProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-muted group cursor-pointer">
                    {src ? (
                        <>
                            <Image
                                src={src}
                                alt={alt}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                priority
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 p-2 rounded-full text-white">
                                    <ZoomIn className="w-6 h-6" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                            <span className="text-lg">No image available</span>
                        </div>
                    )}
                </div>
            </DialogTrigger>
            {src && (
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                    <DialogTitle className="sr-only">{alt}</DialogTitle>
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                        <Image
                            src={src}
                            alt={alt}
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}
