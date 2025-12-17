import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { FileUploader } from '@/components/FileUploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { predictImage, PredictionResult } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
// Import the SkeletonLoader component we created
import { SkeletonLoader } from '@/components/SkeletonLoader';

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
    setResult(null); // Clear previous results
  };

  const handleAnalysis = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an image file first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Ensure file is passed correctly to API
      const prediction = await predictImage(file);
      setResult(prediction);
      
      toast({
        title: "Analysis Complete",
        description: "Your retinal image has been successfully analyzed.",
      });

      // Navigate to results page with the data
      setTimeout(() => {
        navigate('/results', { state: { result: prediction, imageUrl: preview } });
      }, 1500);
      
    } catch (error: any) {
      console.error('Analysis error:', error);

      let errorMessage = "Failed to analyze image. Please try again.";
      if (error.response?.status === 400) {
        errorMessage = "Invalid file upload. Please upload a valid retinal image (JPG/PNG).";
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        errorMessage = "Backend server is not running. Please start the Python server on port 8000.";
      }

      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            {t('upload_image')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload a retinal fundus image for AI-powered analysis. Our system can detect 
            cataracts, glaucoma, and diabetic retinopathy with medical-grade accuracy.
          </p>
        </div>

        {/* Upload Section */}
        <FileUploader
          onFileSelect={handleFileSelect}
          selectedFile={file}
          preview={preview}
          loading={loading}
        />

        {/* Analysis Button */}
        {file && preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <Button
              onClick={handleAnalysis}
              disabled={loading}
              variant="default" // Changed from "medical" if not defined, use "default"
              size="lg"
              className="px-8 py-6 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Analyze Image
                </>
              )}
            </Button>
          </motion.div>
        )}
        
        {/* Loading Skeleton */}
        {loading && <SkeletonLoader />}

        {/* Quick Results Preview */}
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-lg border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Analysis Complete
                </CardTitle>
                <CardDescription>
                  Redirecting to detailed results...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    result.predicted_disease === 'Normal' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {result.predicted_disease === 'Normal' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      <span className="font-semibold capitalize">
                        {result.predicted_disease.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm">
                      Confidence: {(result.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Instructions */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Upload Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Image Quality</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Clear, well-lit retinal fundus image</li>
                  <li>• Minimal blur or artifacts</li>
                  <li>• Centered optic disc and macula</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">File Requirements</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• JPG, PNG, or WebP format</li>
                  <li>• Maximum size: 10MB</li>
                  <li>• Minimum resolution: 512x512px</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Medical Disclaimer:</strong> This AI analysis is for educational and screening purposes only. 
            Always consult with a qualified ophthalmologist for proper medical diagnosis and treatment.
          </AlertDescription>
        </Alert>
      </motion.div>
    </div>
  );
};

export default UploadPage;