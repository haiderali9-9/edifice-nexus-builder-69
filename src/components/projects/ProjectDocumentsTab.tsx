
import React from "react";
import { Document } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, File, FileText, Download } from "lucide-react";

interface ProjectDocumentsTabProps {
  documents: Document[] | undefined;
  isLoading: boolean;
  documentSelector: React.ReactNode;
}

const ProjectDocumentsTab = ({ 
  documents, 
  isLoading,
  documentSelector 
}: ProjectDocumentsTabProps) => {

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case "Contract":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "Blueprint":
        return <File className="h-4 w-4 text-cyan-500" />;
      case "Permit":
        return <File className="h-4 w-4 text-green-500" />;
      case "Invoice":
        return <FileText className="h-4 w-4 text-amber-500" />;
      case "Report":
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle>Project Documents</CardTitle>
        {documentSelector}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents && documents.length > 0 ? (
              documents.map((document) => (
                <Card key={document.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        {getDocumentTypeIcon(document.type)}
                        <span className="font-medium">{document.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-4">
                        {new Date(document.upload_date).toLocaleString()}
                      </div>
                      <Badge variant="outline">{document.type}</Badge>
                    </div>
                    <div className="bg-gray-50 p-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">{document.name.split('.').pop()?.toUpperCase()}</span>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                        <a href={document.url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-gray-500">
                No documents linked to this project yet
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectDocumentsTab;
