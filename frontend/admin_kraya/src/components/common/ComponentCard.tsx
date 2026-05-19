"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface ComponentCardProps {
  title?: string;
  children: React.ReactNode;
  form?: React.ReactNode; 
  formTitle?: string; 
  formDescription?: string; 
  showFormHideOption?: boolean; 
  formIcon?: React.ReactNode; 
  formIconColor?: string; 
  formIconBg?: string; 
  className?: string; 
  desc?: string; 
  action?: React.ReactNode; 
  showHideSelection?: boolean; 
  defaultExpanded?: boolean; 
  defaultFormExpanded?: boolean; 
  isExpanded?: boolean; 
  onToggle?: (state: boolean) => void; 
  formAction?: React.ReactNode; 
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  form,
  formTitle,
  formDescription,
  showFormHideOption = true,
  formIcon,
  formIconColor = "text-brand-600",
  formIconBg = "bg-brand-500/10",
  className = "",
  desc = "",
  action,
  showHideSelection = false,
  defaultExpanded = true,
  defaultFormExpanded = true,
  isExpanded: controlledExpanded,
  onToggle,
  formAction,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [isFormExpanded, setIsFormExpanded] = useState(defaultFormExpanded);

  const isExpandedValue = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle(!isExpandedValue);
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <div
      className={`w-full max-w-full rounded-[2rem] border border-border-light bg-bg-card shadow-theme-lg transition-all duration-300 ${className}`}
    >
      {/* Card Header */}
      {(title || desc || action || showHideSelection) && (
        <div className="px-5 py-4 flex items-center justify-between border-b border-border-light">
          <div className="flex-1 min-w-0 mr-4">
            {title && (
              <h3 className="text-base font-black text-text-heading truncate uppercase tracking-tight">
                {title}
              </h3>
            )}
            {desc && (
              <p className="mt-1 text-[11px] font-medium text-text-body/70 truncate uppercase tracking-widest">
                {desc}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {action && <div>{action}</div>}
            {showHideSelection && (
              <button
                onClick={handleToggle}
                className="p-2 rounded-xl text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-all active:scale-95"
                title={isExpandedValue ? "Collapse Card" : "Expand Card"}
              >
                {isExpandedValue ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Card Content */}
      {isExpandedValue && (
        <div className="divide-y divide-gray-100">
          {/* Form Section */}
          {form && (
            <div className="p-3 bg-bg-main/50">
              <div className="bg-bg-card rounded-[1.5rem] border border-border-light shadow-sm overflow-hidden">
                {/* Unified Form Header */}
                {(formTitle || formDescription) && (
                  <div className="px-5 py-4 flex items-center justify-between border-b border-border-light">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 ${formIconBg} rounded-xl shrink-0`}>
                        {formIcon || (
                          <svg className={`w-5 h-5 ${formIconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        {formTitle && <h3 className="text-sm font-black text-text-heading leading-none uppercase tracking-tight">{formTitle}</h3>}
                        {formDescription && <p className="text-[10px] text-text-body/60 font-bold uppercase tracking-widest mt-1.5">{formDescription}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {formAction && <div>{formAction}</div>}
                       {showFormHideOption && (
                         <button
                           onClick={() => setIsFormExpanded(!isFormExpanded)}
                           className="p-2 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-all active:scale-95"
                           title={isFormExpanded ? "Hide Form Content" : "Show Form Content"}
                         >
                           {isFormExpanded ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                       )}
                    </div>
                  </div>
                )}

                {/* Form Content */}
                {isFormExpanded && (
                  <div className="p-6">
                    {form}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Children Section */}
          <div className="p-0 overflow-visible">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentCard;
