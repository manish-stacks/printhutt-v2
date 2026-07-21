import React, { useState } from 'react';
import Image from 'next/image';

interface OrderItem {
    name0?: string;
    name1?: string;
    name2?: string;
    name3?: string;
    selectedDesign?: string;
    radiusValue?: string;
    shapeName?: string;
    orientation?: string;
    variant?: string;
    sizeThickness?: string;
    frameDesign?: string;
    text?: string;
    color?: string;
    font?: string;
    size?: string;
    style?: string;
    lineHeight?: string;
    fontSize?: string;
    width?: string;
    height?: string;
    previewCanvas?: { url: string } | string;
    previewImage?: { url: string } | string;
    previewImageTwo?: { url: string } | string;
    previewImageThree?: { url: string } | string;
    previewImageFour?: { url: string } | string;
    /* 🆕 multi-photo products (heart LED frame = 9 photos).
       order me url-object[] hote hain; safety ke liye string[] bhi handle. */
    customImages?: Array<{ url?: string } | string>;
    photoCount?: number;
}

interface OrderDetailRowProps {
    label: string;
    value: string | undefined;
}

const OrderDetailRow: React.FC<OrderDetailRowProps> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-center justify-between border-b last:border-0 py-2">
            <p className="font-semibold">{label}</p>
            <p>{value}</p>
        </div>
    );
};

const ImageGallery: React.FC<{
    images: Array<{ url: string | undefined; alt: string }>;
    onImageClick: (url: string) => void;
    onDownload: (url: string) => void;
}> = ({ images, onImageClick, onDownload }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        {images.map((img, index) => (
            img.url && (
                <div key={index} className="relative group">
                    <Image
                        onClick={() => onImageClick(img.url!)}
                        alt={img.alt}
                        src={img.url}
                        width={400}
                        height={400}
                        className="rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity w-full"
                    />
                    <button
                        type="button"
                        onClick={() => onDownload(img.url!)}
                        className="absolute bottom-2 right-2 flex items-center gap-1 bg-[#271B54] hover:bg-[#4A3591] text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-md"
                        title="Download image"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v12m0 0l-4-4m4 4l4-4" />
                        </svg>
                        Download
                    </button>
                </div>
            )
        ))}
    </div>
);

interface ImageModalProps {
    imageUrl: string;
    onClose: () => void;
    onDownload: (url: string) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, onDownload }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg max-w-4xl w-full mx-4">
                <div className="flex justify-end mb-2">
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="relative h-[70vh]">
                    <Image
                        src={imageUrl}
                        alt="Preview"
                        fill
                        className="object-contain"
                    />
                </div>
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={() => onDownload(imageUrl)}
                        className="bg-[#271B54] hover:bg-[#4A3591] text-white px-5 py-2 rounded-md font-medium"
                    >
                        Download Image
                    </button>
                </div>
            </div>
        </div>
    );
};

const CustomizeOderModel: React.FC<{ item: OrderItem }> = ({ item }) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const downloadPreviewImage = async (url: string) => {
        const fileName = (() => {
            const base = url.split('?')[0].split('/').pop() || 'photo';
            return /\.(jpe?g|png|webp|gif)$/i.test(base) ? base : `${base}.jpg`;
        })();
        try {
            // S3 pe CORS enabled ho to seedha blob download
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) throw new Error('bad response');
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            // CORS/network fail (S3 URLs pe common) → naya tab me kholo taaki
            // admin right-click → "Save image as" kar sake. Download kabhi block na ho.
            console.warn('Direct download blocked, opening in new tab:', error);
            try {
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch {
                window.open(url, '_blank');
            }
        }
    };

    // Ab custom_data me image String URL ho sakti hai YA {url} object (purane orders).
    // Dono handle karo warna image render nahi hoti.
    const asUrl = (v: unknown): string | undefined =>
        typeof v === "string" ? v : (v as { url?: string } | undefined)?.url;

    const images = [
        { url: asUrl(item?.previewCanvas), alt: "Preview Canvas" },
        { url: asUrl(item?.previewImage), alt: "Preview Image" },
        { url: asUrl(item?.previewImageTwo), alt: "Preview Image Two" },
        { url: asUrl(item?.previewImageThree), alt: "Preview Image Three" },
        { url: asUrl(item?.previewImageFour), alt: "Preview Image Four" }
    ];

    /* 🆕 9-photo heart frame — customImages ko gallery format me normalize */
    const heartImages = Array.isArray(item?.customImages)
        ? item.customImages.map((im, idx) => ({
              url: typeof im === 'string' ? im : im?.url,
              alt: `Photo ${idx + 1}`,
          }))
        : [];

    return (
        <div className="space-y-4">
            <div className="p-6 rounded-lg bg-white shadow-sm">
                {item && (
                    <>
                        <div className="space-y-2">
                            {Array.from({ length: 4 }, (_, i) => (
                                <OrderDetailRow
                                    key={`name${i}`}
                                    label={`Name-${i}`}
                                    value={item[`name${i}` as keyof OrderItem]}
                                />
                            ))}
                            <OrderDetailRow label="Selected Design" value={item.selectedDesign} />
                            <OrderDetailRow label="Radius Value" value={item.radiusValue} />
                            <OrderDetailRow label="Shape Name" value={item.shapeName} />
                            <OrderDetailRow label="Shape Orientation" value={item.orientation} />
                            <OrderDetailRow label="Variant" value={item.variant} />
                            <OrderDetailRow label="Thickness" value={item.sizeThickness} />
                            <OrderDetailRow label="Frame Design" value={item.frameDesign} />
                            <OrderDetailRow label="Text" value={item.text} />
                            <OrderDetailRow label="Color" value={item.color} />
                            <OrderDetailRow label="Font" value={item.font} />
                            <OrderDetailRow label="Size" value={item.size} />
                            <OrderDetailRow label="Style" value={item.style} />
                            <OrderDetailRow label="Line Height" value={item.lineHeight} />
                            <OrderDetailRow label="Font Size" value={item.fontSize} />
                            {item.width && item.height && (
                                <OrderDetailRow
                                    label="Box Size"
                                    value={`${item.width}" x ${item.height}"`}
                                />
                            )}
                        </div>
                        <ImageGallery images={images} onImageClick={setSelectedImage} onDownload={downloadPreviewImage} />

                        {heartImages.length > 0 && (
                            <div className="mt-4 border-t pt-4">
                                <p className="font-semibold mb-2">
                                    Uploaded Photos ({heartImages.filter((h) => h.url).length})
                                </p>
                                <ImageGallery images={heartImages} onImageClick={setSelectedImage} onDownload={downloadPreviewImage} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedImage && (
                <ImageModal
                    imageUrl={selectedImage}
                    onClose={() => setSelectedImage(null)}
                    onDownload={downloadPreviewImage}
                />
            )}
        </div>
    );
};

export default CustomizeOderModel;