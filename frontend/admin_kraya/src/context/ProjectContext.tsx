"use client";
import React, { createContext, useContext, useState } from "react";

interface ProjectContextType {
  selectedProject: any;
  setSelectedProject: (project: any) => void;
  permissions: string[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState({ id: "kraya-master", name: "Kraya Master" });
  const [permissions] = useState(["admin", "superadmin"]);

  return (
    <ProjectContext.Provider value={{ selectedProject, setSelectedProject, permissions }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within a ProjectProvider");
  return context;
};
