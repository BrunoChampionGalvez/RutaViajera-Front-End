"use client";

import { UserContext } from "@/context/userContext";
import { IDecodeToken } from "@/interfaces";
import { jwtDecode } from "jwt-decode";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect } from "react";

const OAuthHandler = () => {
  const { setIsLogged, setIsAdmin, setUser } = useContext(UserContext);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (token) {
      try {
        // Decode the token to get user info
        const decodedToken = jwtDecode<IDecodeToken>(token);
        
        // Store token in localStorage
        localStorage.setItem("token", token);
        
        // Update context state
        setIsLogged(true);
        setIsAdmin(decodedToken.isAdmin);
        
        // Set basic user info from token
        setUser({
          id: decodedToken.id.toString(),
          name: decodedToken.name,
          email: decodedToken.email,
          isAdmin: decodedToken.isAdmin,
        });
        
        // Clean the URL by removing the token parameter
        const currentPath = window.location.pathname;
        router.replace(currentPath);
        
        console.log("OAuth login successful:", decodedToken);
      } catch (error) {
        console.error("Error processing OAuth token:", error);
        // If token is invalid, redirect to login
        router.push("/login");
      }
    }
  }, [searchParams, setIsLogged, setIsAdmin, setUser, router]);

  return null; // This component doesn't render anything
};

export default OAuthHandler;