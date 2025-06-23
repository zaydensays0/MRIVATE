
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
  Eye,
  Folder,
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
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const ImageFileCard = ({ file, onView, onUnhide, onDelete }: {
    file: HiddenFile;
    onView: (file: HiddenFile) => void;
    onUnhide: (fileId: number) => void;
    onDelete: (fileId: number, fileName: string) => void;
}) => {
    const [imageUrl, setImageUrl] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        let objectUrl: string | null = null;
        const loadImage = async () => {
            setIsLoading(true);
            try {
                const fileWithData = await db.getFile(file.id);
                if (fileWithData && fileWithData.type.startsWith('image/')) {
                    objectUrl = URL.createObjectURL(fileWithData.data);
                    setImageUrl(objectUrl);
                }
            } catch (error) {
                console.error("Failed to load image for grid view:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load image for preview.",
                });
            } finally {
                setIsLoading(false);
            }
        };
        loadImage();
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [file.id, file.type, toast]);

    return (
        <Card className="overflow-hidden group relative shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="aspect-square w-full bg-muted flex items-center justify-center">
                {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : imageUrl ? (
                    <img src={imageUrl} alt={file.name} className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
            </div>
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 border-white/50 bg-black/20 text-white hover:bg-white/30" onClick={() => onView(file)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>View</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 border-white/50 bg-black/20 text-white hover:bg-white/30" onClick={() => onUnhide(file.id)}>
                                    <Download className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Download</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 border-red-500/80 bg-black/20 text-red-500 hover:bg-red-500/30" onClick={() => onDelete(file.id, file.name)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
            
            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <p className="text-white text-xs font-semibold truncate">{file.name}</p>
            </div>
        </Card>
    );
};


export function FileCloaker() {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<HiddenFile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showDeleteReminder, setShowDeleteReminder] = React.useState(false);
  const [viewingFile, setViewingFile] = React.useState<{ id: number; url: string; name: string; type: string } | null>(null);
  const [loadingViewId, setLoadingViewId] = React.useState<number | null>(null);


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

  const groupedFiles = React.useMemo(() => {
    const groups: Record<string, HiddenFile[]> = {
      image: [],
      video: [],
      audio: [],
      document: [],
      other: [],
    };
    files.forEach((file) => {
      const category = file.category || "other";
      if (groups[category]) {
        groups[category].push(file);
      } else {
        groups.other.push(file);
      }
    });
    return groups;
  }, [files]);

  const categoryOrder: (keyof typeof groupedFiles)[] = ["image", "video", "audio", "document", "other"];
  
  const categoryDisplayNames: Record<string, string> = {
      image: "Images",
      video: "Videos",
      audio: "Audio Files",
      document: "Documents",
      other: "Other Files",
  };

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
      const fileWithData = await db.getFile(newFileId);
      if (fileWithData) {
        const newFile: HiddenFile = {
            id: fileWithData.id,
            name: fileWithData.name,
            type: fileWithData.type,
            size: fileWithData.size,
            lastModified: fileWithData.lastModified,
            category: fileWithData.category,
        };
        setFiles((prevFiles) => [newFile, ...prevFiles].sort((a, b) => b.id - a.id));
        toast({
            title: "File Hidden",
            description: `"${selectedFile.name}" has been successfully hidden.`,
        });
        setShowDeleteReminder(true);
      }
    } catch (error) {
      console.error("Failed to hide file:", error);
      toast({
        variant: "destructive",
        title: "Error Hiding File",
        description: "There was a problem hiding your file. Please try again.",
      });
    } finally {
      setIsProcessing(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleViewFile = async (file: HiddenFile) => {
    setLoadingViewId(file.id);
    try {
      const fileWithData = await db.getFile(file.id);
      if (fileWithData) {
        const url = URL.createObjectURL(fileWithData.data);
        setViewingFile({ id: file.id, url: url, name: file.name, type: file.type });
      } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not find file data.",
        });
      }
    } catch (error) {
      console.error("Failed to load file for viewing:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load file for viewing.",
      });
    } finally {
      setLoadingViewId(null);
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

  const renderImageGrid = (filesToRender: HiddenFile[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2 md:p-4">
      {filesToRender.map((file) => (
        <ImageFileCard
          key={file.id}
          file={file}
          onView={handleViewFile}
          onUnhide={handleUnhideFile}
          onDelete={handleDeleteFile}
        />
      ))}
    </div>
  );

  const renderFilesTable = (filesToRender: HiddenFile[]) => (
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
                {filesToRender.map((file) => (
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
                                    <Button variant="ghost" size="icon" onClick={() => handleViewFile(file)} disabled={loadingViewId === file.id}>
                                        {loadingViewId === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>View File</p></TooltipContent>
                            </Tooltip>
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
                ))}
            </TableBody>
        </Table>
    </div>
  );


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

        <div className="space-y-4">
            {isLoading ? (
                <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : files.length > 0 ? (
                <Accordion type="multiple" className="w-full" defaultValue={["image"]}>
                    {categoryOrder.map((category) => {
                        const categoryFiles = groupedFiles[category];
                        if (categoryFiles.length === 0) return null;
                        
                        return (
                            <AccordionItem value={category} key={category}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-3 text-lg">
                                        <Folder className="h-6 w-6 text-primary" />
                                        <span>{categoryDisplayNames[category]}</span>
                                        <Badge variant="secondary">{categoryFiles.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {category === 'image' 
                                      ? renderImageGrid(categoryFiles) 
                                      : renderFilesTable(categoryFiles)
                                    }
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            ) : (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                    <Inbox className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
                    <h3 className="text-xl font-semibold mb-1">No hidden files yet</h3>
                    <p className="text-muted-foreground">Click "Hide a File" to get started.</p>
                </div>
            )}
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
      <Dialog
        open={!!viewingFile}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            if (viewingFile) {
              URL.revokeObjectURL(viewingFile.url);
            }
            setViewingFile(null);
          }
        }}
      >
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="truncate">{viewingFile?.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 py-4">
          {viewingFile &&
            (() => {
              if (viewingFile.type.startsWith("image/")) {
                return (
                  <img
                    src={viewingFile.url}
                    alt={viewingFile.name}
                    className="max-w-full max-h-[75vh] object-contain mx-auto"
                  />
                );
              }
              if (viewingFile.type.startsWith("video/")) {
                return (
                  <video
                    src={viewingFile.url}
                    controls
                    className="w-full max-h-[75vh]"
                  ></video>
                );
              }
              if (viewingFile.type.startsWith("audio/")) {
                return (
                  <audio
                    src={viewingFile.url}
                    controls
                    className="w-full"
                  ></audio>
                );
              }
              if (viewingFile.type === "application/pdf") {
                return (
                  <iframe
                    src={viewingFile.url}
                    className="w-full h-[75vh]"
                    title={viewingFile.name}
                  ></iframe>
                );
              }
              return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted rounded-lg">
                  <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="font-semibold">Preview not available</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    This file type cannot be previewed in the browser.
                  </p>
                  <Button onClick={() => viewingFile && handleUnhideFile(viewingFile.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download File
                  </Button>
                </div>
              );
            })()}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
