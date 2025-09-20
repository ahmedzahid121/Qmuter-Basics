"use client"
import { useAuth as useAuthContext } from "@/context/AuthContext"
import { useAdmin as useAdminContext } from "@/hooks/use-admin";

export const useAuth = () => {
    return useAuthContext();
}

export const useAdmin = () => {
    return useAdminContext();
}
