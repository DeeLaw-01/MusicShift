import { useDropzone } from "react-dropzone";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn, formatFileSize, isAudioFile } from "@/lib/utils";
import { CloudUpload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  maxSize?: number; // in bytes, default 15MB
}

export default function FileDropzone({
  onFilesAccepted,
  maxSize = 15 * 1024 * 1024, // 15MB default
}: FileDropzoneProps) {
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        // Check file type
        if (!isAudioFile(file)) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported audio format. Please upload MP3 or WAV files.`,
            variant: "destructive",
          });
          return false;
        }

        // Check file size
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} is ${formatFileSize(file.size)}, which exceeds the ${formatFileSize(maxSize)} limit.`,
            variant: "destructive",
          });
          return false;
        }

        return true;
      });

      if (validFiles.length > 0) {
        onFilesAccepted(validFiles);
      }
    },
    [onFilesAccepted, maxSize, toast]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
    },
    maxSize,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "dropzone p-8 rounded-lg text-center cursor-pointer border-2 border-dashed border-primary transition-all",
        isDragActive && "bg-primary/5",
        isDragReject && "border-red-500 bg-red-50"
      )}
    >
      <input {...getInputProps()} />
      {isDragReject ? (
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 h-12 w-12 mb-2" />
          <p className="text-lg mb-2">File type not supported</p>
          <p className="text-sm text-gray-500">Please drop an audio file (MP3, WAV)</p>
        </div>
      ) : (
        <>
          <CloudUpload className="mx-auto text-primary h-12 w-12 mb-2" />
          <p className="text-lg mb-2">
            {isDragActive ? "Drop your audio file here" : "Drag and drop your audio file here"}
          </p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <Button variant="default">Browse Files</Button>
          <p className="text-xs text-gray-500 mt-4">
            Supported formats: MP3, WAV (Max {formatFileSize(maxSize)})
          </p>
        </>
      )}
    </div>
  );
}
