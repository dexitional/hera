import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { CheckCircle2, ChevronDown, User, Mail, Phone, Key, RefreshCw, Loader2 } from "lucide-react";
import { getElectionsFn } from "#/server/tenant-elections";
import VoterAdminForm from "#/components/election/VoterAdminForm";

// Types matching the precise columns of the 'voters' Drizzle schema
interface CreateVoterFormData {
  electionId: number;    // references elections.id (ForeignKey)
  name: string;          // e.g. "Kwame Mensah"
  username: string;      // varchar(50) -> e.g. "kwame_m"
  phoneNumber: string;   // text string format
  email: string;         // text unique string 
  inviteToken: string;   // updated to a 6-digit unique invitation code
  isVerified: boolean;   // defaults to false
  hasVoted: boolean;     // defaults to false
}

export const Route = createFileRoute("/admin/voters/new")({
  component: CreateVoter,
  loader: async () => {
    const elections = await getElectionsFn();
    return { elections }
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-purple-500" />
    </div>
  ),
});

function CreateVoter() {
  const { elections  }:any = Route.useLoaderData();
  return <VoterAdminForm data={{ elections }} />;
}
