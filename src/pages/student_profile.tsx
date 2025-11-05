"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StudentData } from "./student";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, User, ShieldAlert } from "lucide-react";

interface StudentProfileProps {
  studentData: StudentData;
  onNavigate: (v: string) => void;
}

type FullStudentProfile = {
  id: string;
  name: string;
  dob: string;
  gender: string;
  blood_group: string;
  category: string;
  aadhar_number: string;
  pan: string;
  disability_status: boolean;
  contact_information: string | null;
  emergency_contacts: string | null;
  photo_path: string | null;
};

const StudentProfilePage: React.FC<StudentProfileProps> = ({
  studentData,
  onNavigate,
}) => {
  const [fullProfile, setFullProfile] = useState<FullStudentProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("student")
        .select("*")
        .eq("id", studentData.user_id)
        .single();

      if (error || !data) {
        setError("No student profile found.");
      } else {
        setFullProfile(data as FullStudentProfile);

        if (data.photo_path) {
          const { data: pub } = supabase.storage
            .from("profile_photo")
            .getPublicUrl(data.photo_path);

          // Prevent browser caching older image
          setAvatarUrl(`${pub?.publicUrl}?t=${Date.now()}`);
        }
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading)
    return <Loader2 className="animate-spin mt-10 mx-auto" />;
  if (error)
    return (
      <div className="text-red-400 mt-10 text-center">
        <ShieldAlert /> {error}
      </div>
    );

  // ✅ Convert boolean to display text
  const disabilityText =
    fullProfile?.disability_status === true
      ? "True"
      : fullProfile?.disability_status === false
      ? "N/A"
      : "—";

  // ✅ Photo Upload Handler
  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${studentData.user_id}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("profile_photo")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError("Failed to upload photo.");
      return;
    }

    // Update DB column
    const { error: updateError } = await supabase
      .from("student")
      .update({ photo_path: filePath })
      .eq("id", studentData.user_id);

    if (updateError) {
      setError("Failed to update profile photo.");
      return;
    }

    // Refresh display image
    const { data: pub } = supabase.storage
      .from("profile_photo")
      .getPublicUrl(filePath);

    setAvatarUrl(`${pub?.publicUrl}?t=${Date.now()}`);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => onNavigate("dashboard")}>
        <ArrowLeft className="mr-2" /> Back
      </Button>

      {/* PROFILE HEADER */}
      <div className="flex items-center space-x-4">
        {avatarUrl ? (
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600">
                <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover object-center border-2 border-gray-600"
                />
            </div>
        ) : (
          <User className="w-24 h-24" />
        )}

        <div className="flex flex-col">
          <h2 className="text-xl font-bold">{fullProfile!.name}</h2>
          <p>{studentData.email}</p>

          <label className="mt-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <span className="cursor-pointer text-sm bg-blue-600 px-3 py-1 rounded-md hover:bg-blue-700">
              Upload Photo
            </span>
          </label>
        </div>
      </div>

      {/* GRID FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          ["Date of Birth", fullProfile?.dob],
          ["Gender", fullProfile?.gender],
          ["Blood Group", fullProfile?.blood_group],
          ["Category", fullProfile?.category],
          ["Aadhar Number", fullProfile?.aadhar_number],
          ["PAN", fullProfile?.pan],
          ["Disability Status", disabilityText],
        ].map(([label, value]) => (
          <div key={label} className="bg-gray-900 p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-400">{label}</h3>
            <p className="text-lg mt-1">{value || "—"}</p>
          </div>
        ))}
      </div>

      {/* CONTACT INFO */}
      <div className="bg-gray-900 p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Contact Information</h2>

        <p>
          <strong>Mobile:</strong>{" "}
          {fullProfile?.contact_information || "—"}
        </p>


        <p>
          <strong>Mobile:</strong>{" "}
          {fullProfile?.emergency_contacts || "—"}
        </p>

        
      </div>

      
    </div>
  );
};

export default StudentProfilePage;
