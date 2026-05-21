import React from "react";
import { motion } from "framer-motion";

const MotionButton = motion.button;
import { cn } from "../../lib/utils";

export const LiquidButton = ({ children, onClick, type = "button", className = "", disabled = false, ...props }) => {
    return (
        <MotionButton
            type={type}
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "relative inline-flex items-center justify-center px-8 py-3 overflow-hidden",
                "font-black uppercase tracking-widest text-[11px] text-white",
                "bg-[#F39200] rounded-xl transition-all duration-300 group",
                disabled && "pointer-events-none opacity-60",
                className
            )}
            {...props}

        >
            <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-accent rounded-full group-hover:w-full group-hover:h-80"></span>
            <span className="relative flex items-center justify-center gap-2 z-10">{children}</span>

        </MotionButton>
    );
};

