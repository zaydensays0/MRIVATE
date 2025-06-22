"use client";

import * as React from "react";
import {
  ShieldCheck,
  UploadCloud,
  File as FileIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText as FileTextIcon,
  Music as MusicIcon,
  Download,
  Trash2,
  Loader2,
  Inbox,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import * as db from "@/lib/db";
import type { HiddenFile } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

const FileTypeIcon = ({ type }: { type: string }) => {
  if (type.startsWith("image/")) {
    return <ImageIcon className="h-5 w-5 text-muted-foreground" />;
  }
  if (type.startsWith("video/")) {
    return <VideoIcon className="h-5 w-5 text-muted-foreground" />;
  }
  if (type.startsWith("audio/")) {
      return <MusicIcon className="h-5 w-5 text-muted-foreground" />;
  }
  if (type === "application/pdf") {
    return <FileTextIcon className="h-5 w-5 text-muted-foreground" />;
  }
  return <FileIcon className="h-5 w-5 text-muted-foreground" />;
};


export function FileCloaker() {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<HiddenFile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showDeleteReminder, setShowDeleteReminder] = React.useState(false);

  React.useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true);
      try {
        const storedFiles = await db.getFiles();
        setFiles(storedFiles.sort((a, b) => b.id - a.id));
      } catch (error) {
        console.error("Failed to load files:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load hidden files from the database.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadFiles();
  }, [toast]);

  const handleHideFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const newFileId = await db.addFile(selectedFile);
      const newFile: HiddenFile = {
        id: newFileId,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        lastModified: selectedFile.lastModified,
      };
      setFiles((prevFiles) => [newFile, ...prevFiles]);
      toast({
        title: "File Hidden",
        description: `"${selectedFile.name}" has been successfully hidden.`,
      });
      setShowDeleteReminder(true);
    } catch (error) {
      console.error("Failed to hide file:", error);
      toast({
        variant: "destructive",
        title: "Error Hiding File",
        description: "There was a problem hiding your file. Please try again.",
      });
    } finally {
      setIsProcessing(false);
      // Reset file input
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUnhideFile = async (fileId: number) => {
    const file = await db.getFile(fileId);
    if (file) {
      const url = URL.createObjectURL(file.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
       toast({
        title: "File Restored",
        description: `"${file.name}" is being downloaded.`,
      });
    }
  };
  
  const handleDeleteFile = async (fileId: number, fileName: string) => {
    try {
        await db.deleteFile(fileId);
        setFiles(files.filter((f) => f.id !== fileId));
        toast({
            title: "File Deleted",
            description: `"${fileName}" has been removed from your hidden files.`,
        });
    } catch(error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete the file.",
        });
    }
  };

  return (
    <>
    <Card className="w-full shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-3 mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-headline">File Cloaker</CardTitle>
        </div>
        <CardDescription>
          Securely hide your files inside the browser. They never leave your device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-6">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
            />
            <Button size="lg" onClick={handleHideFileClick} disabled={isProcessing}>
                {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <UploadCloud className="mr-2 h-4 w-4" />
                )}
                Hide a File
            </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Date Hidden</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                            </TableCell>
                        </TableRow>
                    ) : files.length > 0 ? (
                        files.map((file) => (
                        <TableRow key={file.id}>
                            <TableCell>
                                <FileTypeIcon type={file.type} />
                            </TableCell>
                            <TableCell className="font-medium truncate max-w-xs">{file.name}</TableCell>
                            <TableCell>{formatBytes(file.size)}</TableCell>
                            <TableCell>{new Date(file.lastModified).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                            <TooltipProvider>
                                <div className="flex justify-end gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleUnhideFile(file.id)}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Unhide / Download</p></TooltipContent>
                                </Tooltip>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteFile(file.id, file.name)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Delete Forever</p></TooltipContent>
                                </Tooltip>
                                </div>
                            </TooltipProvider>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center">
                                <Inbox className="mx-auto h-10 w-10 text-muted-foreground mb-2"/>
                                <p className="font-semibold">No hidden files yet</p>
                                <p className="text-sm text-muted-foreground">Click "Hide a File" to get started.</p>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
    <AlertDialog open={showDeleteReminder} onOpenChange={setShowDeleteReminder}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>File Hidden Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              For your security, File Cloaker cannot delete the original file from your device. Please remember to manually delete the original file to ensure it is fully hidden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDeleteReminder(false)}>I Understand</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
