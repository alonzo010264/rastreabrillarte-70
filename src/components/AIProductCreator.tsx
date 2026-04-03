import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sparkles, 
  Play, 
  X, 
  Image as ImageIcon, 
  Loader2,
  Terminal,
  Plus,
  Check,
  AlertCircle
} from "lucide-react";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

interface CommandLine {
  lineNumber: number;
  content: string;
  images: UploadedImage[];
}

interface ExecutionResult {
  success: boolean;
  message: string;
  products?: Array<{ nombre: string; precio: number }>;
}

export const AIProductCreator = ({ onProductsCreated }: { onProductsCreated: () => void }) => {
  const [lines, setLines] = useState<CommandLine[]>([
    { lineNumber: 1, content: "", images: [] }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const updateLineContent = useCallback((index: number, content: string) => {
    setLines(prev => {
      const newLines = [...prev];
      newLines[index] = { ...newLines[index], content };
      return newLines;
    });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    const line = lines[index];
    
    // Enter creates new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const newLine: CommandLine = {
        lineNumber: lines.length + 1,
        content: "",
        images: []
      };
      setLines(prev => {
        const newLines = [...prev];
        newLines.splice(index + 1, 0, newLine);
        // Renumber all lines
        return newLines.map((l, i) => ({ ...l, lineNumber: i + 1 }));
      });
      setCurrentLine(index + 1);
      setTimeout(() => {
        textareaRefs.current[index + 1]?.focus();
      }, 10);
    }
    
    // Backspace on empty line removes it
    if (e.key === "Backspace" && line.content === "" && lines.length > 1 && index > 0) {
      e.preventDefault();
      setLines(prev => {
        const newLines = prev.filter((_, i) => i !== index);
        return newLines.map((l, i) => ({ ...l, lineNumber: i + 1 }));
      });
      setCurrentLine(index - 1);
      setTimeout(() => {
        textareaRefs.current[index - 1]?.focus();
      }, 10);
    }

    // Arrow keys for navigation
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      setCurrentLine(index - 1);
      textareaRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowDown" && index < lines.length - 1) {
      e.preventDefault();
      setCurrentLine(index + 1);
      textareaRefs.current[index + 1]?.focus();
    }
  }, [lines]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages: UploadedImage[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} no es una imagen válida`);
        continue;
      }

      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });

      newImages.push({
        id: crypto.randomUUID(),
        url: dataUrl,
        name: file.name
      });
    }

    setLines(prev => {
      const newLines = [...prev];
      newLines[currentLine] = {
        ...newLines[currentLine],
        images: [...newLines[currentLine].images, ...newImages]
      };
      return newLines;
    });

    toast.success(`${newImages.length} imagen(es) agregada(s) a línea ${currentLine + 1}`);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [currentLine]);

  const removeImage = useCallback((lineIndex: number, imageId: string) => {
    setLines(prev => {
      const newLines = [...prev];
      newLines[lineIndex] = {
        ...newLines[lineIndex],
        images: newLines[lineIndex].images.filter(img => img.id !== imageId)
      };
      return newLines;
    });
  }, []);

  const extractCommands = useCallback((): string[] => {
    // Join all lines and split by semicolon
    const fullText = lines.map(l => l.content).join("\n");
    return fullText
      .split(";")
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
  }, [lines]);

  const getAllImages = useCallback((): UploadedImage[] => {
    return lines.flatMap(l => l.images);
  }, [lines]);

  const executeCommands = async () => {
    const commands = extractCommands();
    const images = getAllImages();

    if (commands.length === 0) {
      toast.error("Escribe al menos un comando terminado en ;");
      return;
    }

    setIsProcessing(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("ai-product-creator", {
        body: {
          commands,
          images: images.map(img => ({ url: img.url, name: img.name }))
        }
      });

      if (error) throw error;

      if (data.success) {
        setResults(data.results || []);
        toast.success(`${data.productsCreated || 0} producto(s) creado(s) exitosamente`);
        onProductsCreated();
        
        // Clear the editor
        setLines([{ lineNumber: 1, content: "", images: [] }]);
        setCurrentLine(0);
      } else {
        toast.error(data.error || "Error al procesar comandos");
        setResults([{ success: false, message: data.error || "Error desconocido" }]);
      }
    } catch (error) {
      console.error("Error executing commands:", error);
      toast.error("Error al ejecutar comandos de IA");
      setResults([{ success: false, message: "Error de conexión con el servidor" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setLines([{ lineNumber: 1, content: "", images: [] }]);
    setCurrentLine(0);
    setResults([]);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Crear Productos con IA
          <Badge variant="secondary" className="ml-2">Beta</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Escribe comandos en lenguaje natural para crear productos. Termina cada comando con <code className="bg-muted px-1 rounded">;</code>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Code Editor */}
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="bg-muted/50 px-3 py-2 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Terminal className="w-4 h-4" />
              <span>Editor de Comandos</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <ImageIcon className="w-4 h-4 mr-1" />
                Agregar Imagen
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
          
          <ScrollArea className="h-64">
            <div className="p-2 font-mono text-sm">
              {lines.map((line, index) => (
                <div key={line.lineNumber} className="flex group">
                  {/* Line Number */}
                  <div className={`w-10 text-right pr-3 select-none ${
                    currentLine === index ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {line.lineNumber}
                  </div>
                  
                  {/* Content Area */}
                  <div className="flex-1 min-w-0">
                    <textarea
                      ref={(el) => { textareaRefs.current[index] = el; }}
                      value={line.content}
                      onChange={(e) => updateLineContent(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onFocus={() => setCurrentLine(index)}
                      placeholder={index === 0 ? "Crea un producto llamado 'Flores Bonitas' con precio 150..." : ""}
                      className={`w-full bg-transparent border-none outline-none resize-none min-h-[24px] py-0.5 placeholder:text-muted-foreground/50 ${
                        currentLine === index ? "text-foreground" : "text-foreground/80"
                      }`}
                      rows={1}
                      style={{ height: "auto" }}
                      disabled={isProcessing}
                    />
                    
                    {/* Images attached to this line */}
                    {line.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1 mb-2">
                        {line.images.map((img) => (
                          <div key={img.id} className="relative group/img">
                            <img
                              src={img.url}
                              alt={img.name}
                              className="h-12 w-12 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index, img.id)}
                              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Help text */}
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 rounded-lg p-3">
          <p className="font-medium">Ejemplos de comandos:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Crea un producto "Aretes de Flores" precio 120, descripción elegante;</li>
            <li>Agrega producto Pulsera Corazones a $85 con 20% descuento;</li>
            <li>Nuevo collar dorado, precio 200, stock 50, destacado;</li>
            <li>Agrega pulsera mariposas en preventa precio 300 mínimo 600;</li>
          </ul>
          <p className="mt-2 text-primary">💡 Sube imágenes y se asignarán al producto actual</p>
          <p className="text-primary">🛒 Usa "preventa" para productos de preorden con monto mínimo configurable</p>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Resultados:</p>
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 p-2 rounded text-sm ${
                  result.success 
                    ? "bg-green-500/10 text-green-600" 
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {result.success ? (
                  <Check className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span>{result.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={executeCommands}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Ejecutar Comandos
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={clearAll}
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
