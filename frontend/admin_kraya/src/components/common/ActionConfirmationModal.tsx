import React from 'react';
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";

interface ActionConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    variant?: "primary" | "error" | "brand";
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    variant = "brand"
}) => {
    const iconClasses = {
        primary: "bg-brand-50 text-brand-600",
        error: "bg-error-50 text-error-600",
        brand: "bg-brand-50 text-brand-600",
    };

    const buttonVariants: Record<string, "primary" | "danger"> = {
        primary: "primary",
        error: "danger",
        brand: "primary",
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[420px] p-8 lg:p-10"
        >
            <div className="flex flex-col items-center justify-center text-center">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${iconClasses[variant]}`}>
                    <AlertCircle size={32} strokeWidth={2.5} />
                </div>
                <h4 className="font-black text-text-heading mb-3 text-2xl uppercase tracking-tighter">
                    {title}
                </h4>
                <p className="text-sm text-text-body/70 mb-8 font-semibold uppercase tracking-tight">
                    {description}
                </p>
                <div className="flex items-center justify-center w-full gap-4">
                    <Button className="w-full" variant="outline" onClick={onClose}>
                        CANCEL
                    </Button>
                    <Button 
                        className="w-full" 
                        variant={buttonVariants[variant]} 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText.toUpperCase()}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
