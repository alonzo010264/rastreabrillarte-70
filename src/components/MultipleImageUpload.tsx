import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface MultipleImageUploadProps {
  onImagesUpload: (imageUrls: string[]) => void;
  maxImages?: number;
  existingImages?: string[];
}

export const MultipleImageUpload = ({ 
  onImagesUpload, 
  maxImages = 5,
  existingImages = []
}: MultipleImageUploadProps) => {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + images.length > maxImages) {
      toast.error(`Solo puedes subir máximo ${maxImages} imágenes`);
      return;
    }

    setUploading(true);

    try {
      const newImageUrls: string[] = [];

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} no es una imagen válida`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} es muy grande (máximo 5MB)`);
          continue;
        }

        // Convertir a base64/data URL para preview
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        newImageUrls.push(dataUrl);
      }

      const updatedImages = [...images, ...newImageUrls];
      setImages(updatedImages);
      onImagesUpload(updatedImages);
      
      toast.success(`${newImageUrls.length} imagen(es) agregada(s)`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Error al cargar las imágenes');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesUpload(updatedImages);
    toast.success('Imagen eliminada');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image}
              alt={`Producto ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeImage(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <label className="border-2 border-dashed border-muted-foreground/25 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {uploading ? 'Cargando...' : 'Agregar imagen'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">
        {images.length} de {maxImages} imágenes. Máximo 5MB por imagen.
      </p>
    </div>
  );
};