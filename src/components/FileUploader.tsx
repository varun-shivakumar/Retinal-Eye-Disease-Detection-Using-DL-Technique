import React, { useState, useCallback } from 'react';
import { Upload, Camera, X, Image as ImageIcon } from 'lucide-react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  preview: string | null;
  loading?: boolean;
}

export function FileUploader({ onFileSelect, selectedFile, preview, loading = false }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = React.useRef<Webcam>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Convert base64 to file
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onFileSelect(file);
            setShowWebcam(false);
          });
      }
    }
  }, [onFileSelect]);

  const clearFile = () => {
    onFileSelect(null as any);
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  if (showWebcam) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Camera Capture</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowWebcam(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative rounded-lg overflow-hidden bg-black">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-auto max-h-96 object-cover"
                videoConstraints={{
                  facingMode: "user",
                  width: 640,
                  height: 480
                }}
              />
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button onClick={capture} variant="medical" size="lg">
                <Camera className="h-4 w-4 mr-2" />
                Capture Image
              </Button>
              <Button onClick={() => setShowWebcam(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* File Upload Area */}
      <Card 
        className={cn(
          "transition-all duration-300 cursor-pointer hover:shadow-medical",
          dragActive && "border-primary shadow-medical scale-105",
          loading && "pointer-events-none opacity-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <Upload className="h-8 w-8 text-white" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {dragActive ? "Drop your image here" : "Upload Retinal Image"}
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop an image file, or click to browse
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="medical" size="lg" asChild>
                <label htmlFor="fileInput" className="cursor-pointer">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Choose File
                </label>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowWebcam(true)}
              >
                <Camera className="h-4 w-4 mr-2" />
                Use Camera
              </Button>
            </div>

            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
            
            <p className="text-xs text-muted-foreground">
              Supported formats: JPG, PNG, WebP (Max 10MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && selectedFile && (
        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-success rounded-full"></div>
                  <span className="text-sm text-success">Ready for analysis</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}