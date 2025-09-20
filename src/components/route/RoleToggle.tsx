import React from "react";
import { motion } from "framer-motion";
import { Car, User } from "lucide-react";

interface RoleToggleProps {
  userRole: 'driver' | 'rider';
  onRoleChange: (role: 'driver' | 'rider') => void;
}

export default function RoleToggle({ userRole, onRoleChange }: RoleToggleProps) {
  return (
    <div className="relative bg-slate-100 p-1 rounded-xl">
      <motion.div
        className="absolute inset-y-1 bg-white rounded-lg shadow-sm"
        animate={{
          x: userRole === 'driver' ? 0 : '100%',
          width: userRole === 'driver' ? '50%' : '50%'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      
      <div className="relative flex">
        <button
          onClick={() => onRoleChange('driver')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative z-10 ${
            userRole === 'driver' 
              ? 'text-slate-800' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Car className="w-4 h-4" />
          Driver
        </button>
        <button
          onClick={() => onRoleChange('rider')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative z-10 ${
            userRole === 'rider' 
              ? 'text-slate-800' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" />
          Rider
        </button>
      </div>
    </div>
  );
}
